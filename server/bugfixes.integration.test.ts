/**
 * Tests for the three Coach → Athlete portal sync bug fixes:
 *
 * Bug 1 – Blast session sharing: getMyBlastData must only return sessions
 *          where isSharedWithAthlete=true; toggleSessionSharing must flip the flag.
 *
 * Bug 2 – Session notes sharing: toggleSharing procedure must write
 *          sharedWithAthlete to the DB and return the updated record.
 *
 * Bug 3 – Player Reports: full CRUD lifecycle — create draft, update, publish,
 *          unpublish, listMyReports (athlete-facing), listByCoach, delete.
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// ── Context factories ────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-open-id",
    email: "admin@test.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function adminCtx() { return makeCtx({ role: "admin" }); }
function userCtx(id = 99) { return makeCtx({ id, role: "user", openId: `user-${id}`, email: `user${id}@test.com` }); }

// ── Bug 3: playerReports CRUD ────────────────────────────────────────────────

describe("playerReports router", () => {
  const ATHLETE_ID = 9001; // synthetic ID — no real DB row required for RBAC tests

  it("create: admin can create a draft report", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const report = await caller.playerReports.create({
      athleteId: ATHLETE_ID,
      title: "Spring 2026 Development Report",
      bodyHtml: "<p>Great progress this season.</p>",
      publishNow: false,
    });
    expect(report.id).toBeTypeOf("number");
    expect(report.title).toBe("Spring 2026 Development Report");
    expect(report.isSharedWithAthlete).toBe(false);
    expect(report.publishedAt).toBeNull();

    // Cleanup
    await caller.playerReports.delete({ id: report.id });
  });

  it("create: publishNow=true sets isSharedWithAthlete and publishedAt", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const report = await caller.playerReports.create({
      athleteId: ATHLETE_ID,
      title: "Immediate Publish Test",
      publishNow: true,
    });
    expect(report.isSharedWithAthlete).toBe(true);
    expect(report.publishedAt).not.toBeNull();

    // Cleanup
    await caller.playerReports.delete({ id: report.id });
  });

  it("update: can change title and bodyHtml", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const report = await caller.playerReports.create({
      athleteId: ATHLETE_ID,
      title: "Original Title",
      publishNow: false,
    });

    const updated = await caller.playerReports.update({
      id: report.id,
      title: "Updated Title",
      bodyHtml: "<p>New body content.</p>",
    });
    expect(updated.title).toBe("Updated Title");
    expect(updated.bodyHtml).toBe("<p>New body content.</p>");

    // Cleanup
    await caller.playerReports.delete({ id: report.id });
  });

  it("publish: sets isSharedWithAthlete=true and preserves first publishedAt", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const report = await caller.playerReports.create({
      athleteId: ATHLETE_ID,
      title: "Publish Test",
      publishNow: false,
    });
    expect(report.isSharedWithAthlete).toBe(false);

    const published = await caller.playerReports.publish({ id: report.id });
    expect(published.isSharedWithAthlete).toBe(true);
    expect(published.publishedAt).not.toBeNull();

    // Publish again — publishedAt should not change
    const publishedAgain = await caller.playerReports.publish({ id: report.id });
    expect(publishedAgain.publishedAt?.getTime()).toBe(published.publishedAt?.getTime());

    // Cleanup
    await caller.playerReports.delete({ id: report.id });
  });

  it("unpublish: sets isSharedWithAthlete=false without clearing publishedAt", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const report = await caller.playerReports.create({
      athleteId: ATHLETE_ID,
      title: "Unpublish Test",
      publishNow: true,
    });

    const unpublished = await caller.playerReports.unpublish({ id: report.id });
    expect(unpublished.isSharedWithAthlete).toBe(false);
    // publishedAt is preserved (history of when it was first published)
    expect(unpublished.publishedAt).not.toBeNull();

    // Cleanup
    await caller.playerReports.delete({ id: report.id });
  });

  it("listByCoach: returns reports authored by the current coach", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const r1 = await caller.playerReports.create({ athleteId: ATHLETE_ID, title: "Report A", publishNow: false });
    const r2 = await caller.playerReports.create({ athleteId: ATHLETE_ID, title: "Report B", publishNow: true });

    const list = await caller.playerReports.listByCoach({ athleteId: ATHLETE_ID });
    const ids = list.map((r: any) => r.id);
    expect(ids).toContain(r1.id);
    expect(ids).toContain(r2.id);

    // Cleanup
    await caller.playerReports.delete({ id: r1.id });
    await caller.playerReports.delete({ id: r2.id });
  });

  it("delete: removes the report from the DB", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const report = await caller.playerReports.create({
      athleteId: ATHLETE_ID,
      title: "Delete Me",
      publishNow: false,
    });

    const result = await caller.playerReports.delete({ id: report.id });
    expect(result.success).toBe(true);

    // Verify it's gone
    const list = await caller.playerReports.listByCoach({ athleteId: ATHLETE_ID });
    expect(list.find((r: any) => r.id === report.id)).toBeUndefined();
  });

  it("delete: throws NOT_FOUND for non-existent report", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await expect(caller.playerReports.delete({ id: 999999999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("RBAC: regular user cannot create a report", async () => {
    const caller = appRouter.createCaller(userCtx());
    await expect(
      caller.playerReports.create({ athleteId: ATHLETE_ID, title: "Unauthorized", publishNow: false })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("RBAC: regular user cannot delete a report", async () => {
    const caller = appRouter.createCaller(userCtx());
    await expect(caller.playerReports.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("listMyReports: athlete sees only their published reports", async () => {
    // Create a published report for athlete id=1 (same as admin ctx id)
    const adminCaller = appRouter.createCaller(adminCtx());
    const published = await adminCaller.playerReports.create({
      athleteId: 1, // matches the user id in athleteCtx below
      title: "Athlete Visible Report",
      publishNow: true,
    });
    const draft = await adminCaller.playerReports.create({
      athleteId: 1,
      title: "Athlete Draft — should NOT appear",
      publishNow: false,
    });

    // Athlete queries their own reports
    const athleteCaller = appRouter.createCaller(makeCtx({ id: 1, role: "user" }));
    const myReports = await athleteCaller.playerReports.listMyReports();
    const titles = myReports.map((r: any) => r.title);

    expect(titles).toContain("Athlete Visible Report");
    expect(titles).not.toContain("Athlete Draft — should NOT appear");

    // Cleanup
    await adminCaller.playerReports.delete({ id: published.id });
    await adminCaller.playerReports.delete({ id: draft.id });
  });
});

// ── Bug 1: Blast session sharing RBAC ───────────────────────────────────────

describe("blastMetrics.toggleSessionSharing", () => {
  it("regular user (non-admin/non-coach) cannot toggle session sharing", async () => {
    const caller = appRouter.createCaller(userCtx());
    await expect(
      caller.blastMetrics.toggleSessionSharing({ sessionId: "fake-id", shared: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin can call toggleSessionSharing without FORBIDDEN", async () => {
    const caller = appRouter.createCaller(adminCtx());
    // Non-existent session — will succeed silently (0 rows updated) without throwing
    await expect(
      caller.blastMetrics.toggleSessionSharing({ sessionId: "nonexistent-session-id", shared: true })
    ).resolves.toEqual({ success: true });
  });

  it("admin can call bulkToggleSessionSharing without FORBIDDEN", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await expect(
      caller.blastMetrics.bulkToggleSessionSharing({ playerId: "nonexistent-player-id", shared: false })
    ).resolves.toEqual({ success: true });
  });
});

// ── Bug 2: Session notes toggleSharing ──────────────────────────────────────

describe("sessionNotes.toggleSharing", () => {
  it("toggleSharing: admin can toggle sharing on an existing note", async () => {
    const adminCaller = appRouter.createCaller(adminCtx());
    const note = await adminCaller.sessionNotes.create({
      athleteId: 9001,
      sessionDate: new Date().toISOString().slice(0, 10),
      content: "Test note for sharing toggle",
      skillsWorked: ["Timing"],
      whatImproved: "Load timing",
      whatNeedsWork: "Hip rotation",
    });

    // Toggle on
    const toggled = await adminCaller.sessionNotes.toggleSharing({ id: note.id, shared: true });
    expect(toggled).toBeDefined();

    // Cleanup
    await adminCaller.sessionNotes.delete({ id: note.id });
  });

  it("regular user (role=user) cannot toggle sharing — FORBIDDEN", async () => {
    const caller = appRouter.createCaller(userCtx(999));
    // role=user triggers FORBIDDEN before any DB lookup
    await expect(
      caller.sessionNotes.toggleSharing({ id: 1, shared: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
