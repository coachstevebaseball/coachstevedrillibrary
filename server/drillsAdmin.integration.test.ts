import { describe, expect, it, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// ─── Context factories ────────────────────────────────────────────────────────

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Generate a unique drillId for each test run to avoid conflicts. */
function testDrillId() {
  return `test-drill-admin-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Track created drillIds so we can clean them up after tests
const createdDrillIds: string[] = [];

afterEach(async () => {
  // Best-effort cleanup: soft-delete any drills created during tests
  if (createdDrillIds.length === 0) return;
  const adminCaller = appRouter.createCaller(createAdminContext());
  for (const drillId of createdDrillIds) {
    try {
      await adminCaller.drillsAdmin.adminDelete({ drillId });
    } catch {
      // ignore cleanup errors
    }
  }
  createdDrillIds.length = 0;
});

// ─── RBAC tests ───────────────────────────────────────────────────────────────

describe("drillsAdmin — RBAC", () => {
  it("rejects adminList from unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.drillsAdmin.adminList({ page: 1 })
    ).rejects.toThrow();
  });

  it("rejects adminList from non-admin user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.drillsAdmin.adminList({ page: 1 })
    ).rejects.toThrow();
  });

  it("rejects adminCreate from non-admin user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.drillsAdmin.adminCreate({
        name: "Forbidden Drill",
        difficulty: "Easy",
        categories: ["Hitting"],
      })
    ).rejects.toThrow();
  });

  it("rejects adminUpdate from unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.drillsAdmin.adminUpdate({ drillId: "some-drill", name: "Hacked" })
    ).rejects.toThrow();
  });

  it("rejects adminDelete from non-admin user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.drillsAdmin.adminDelete({ drillId: "some-drill" })
    ).rejects.toThrow();
  });
});

// ─── adminList ────────────────────────────────────────────────────────────────

describe("drillsAdmin.adminList", () => {
  it("returns paginated results for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.drillsAdmin.adminList({ page: 1 });

    expect(result).toHaveProperty("drills");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page", 1);
    expect(result).toHaveProperty("pageSize");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.drills)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("returns fewer results when searching by name", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const all = await caller.drillsAdmin.adminList({ page: 1 });
    const filtered = await caller.drillsAdmin.adminList({
      page: 1,
      search: "zzz_nonexistent_drill_xyz",
    });

    expect(filtered.total).toBeLessThanOrEqual(all.total);
    expect(filtered.drills.length).toBe(0);
  });

  it("filters by source=hidden to show only hidden drills", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.drillsAdmin.adminList({
      page: 1,
      source: "hidden",
    });

    expect(Array.isArray(result.drills)).toBe(true);
    // All returned drills should be hidden
    for (const drill of result.drills) {
      expect(drill.isHidden).toBe(true);
    }
  });
});

// ─── adminCreate ──────────────────────────────────────────────────────────────

describe("drillsAdmin.adminCreate", () => {
  it("creates a new drill with minimal fields", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    const result = await caller.drillsAdmin.adminCreate({
      drillId,
      name: "Test Minimal Drill",
      difficulty: "Easy",
      categories: ["Hitting"],
    });

    expect(result).toEqual({ success: true, drillId });
  });

  it("creates a drill with all 8 rich coaching fields", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    const result = await caller.drillsAdmin.adminCreate({
      drillId,
      name: "Rich Coaching Drill",
      difficulty: "Medium",
      categories: ["Hitting"],
      goalOfDrill: "Improve barrel path through the zone",
      whoThisDrillIsBestFor: "Hitters who cast the barrel early",
      coachingNotes: ["Keep the elbow in", "Stay connected"],
      whatThisDrillHelpsFix: ["Casting", "Arm barring"],
      howToRunTheDrill: ["Set up tee at waist height", "Take 10 swings focusing on path"],
      commonMistakes: ["Rushing the swing", "Dropping the back shoulder"],
      coachSteveCue: "Knob to the ball, barrel through the zone",
      gameTransferExplanation: "This drill builds the muscle memory for staying short to the ball on inside pitches",
    });

    expect(result).toEqual({ success: true, drillId });
  });

  it("auto-generates drillId from name when not provided", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const uniqueName = `Auto Slug Drill ${Date.now()}`;

    const result = await caller.drillsAdmin.adminCreate({
      name: uniqueName,
      difficulty: "Hard",
      categories: ["Pitching"],
    });

    expect(result.success).toBe(true);
    expect(typeof result.drillId).toBe("string");
    expect(result.drillId.length).toBeGreaterThan(0);
    // Clean up the auto-generated drill
    createdDrillIds.push(result.drillId);
  });

  it("rejects duplicate drillId", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    // Create once
    await caller.drillsAdmin.adminCreate({
      drillId,
      name: "Duplicate Test Drill",
      difficulty: "Easy",
      categories: ["Hitting"],
    });

    // Attempt to create again with same drillId
    await expect(
      caller.drillsAdmin.adminCreate({
        drillId,
        name: "Duplicate Test Drill 2",
        difficulty: "Easy",
        categories: ["Hitting"],
      })
    ).rejects.toThrow(/already exists/i);
  });
});

// ─── adminUpdate ──────────────────────────────────────────────────────────────

describe("drillsAdmin.adminUpdate", () => {
  it("updates name and difficulty of an existing drill", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    await adminCaller.drillsAdmin.adminCreate({
      drillId,
      name: "Original Name",
      difficulty: "Easy",
      categories: ["Hitting"],
    });

    const updateResult = await adminCaller.drillsAdmin.adminUpdate({
      drillId,
      name: "Updated Name",
      difficulty: "Hard",
    });

    expect(updateResult).toEqual({ success: true, drillId });
  });

  it("updates rich coaching fields on an existing drill", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    await adminCaller.drillsAdmin.adminCreate({
      drillId,
      name: "Update Rich Fields Test",
      difficulty: "Medium",
      categories: ["Infield"],
    });

    const updateResult = await adminCaller.drillsAdmin.adminUpdate({
      drillId,
      goalOfDrill: "Build quick first step",
      coachSteveCue: "Explode on contact",
      howToRunTheDrill: ["Get in ready position", "React to ball off bat"],
    });

    expect(updateResult).toEqual({ success: true, drillId });
  });

  it("rejects update with no fields provided", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    await expect(
      adminCaller.drillsAdmin.adminUpdate({ drillId: "some-drill" })
    ).rejects.toThrow(/no fields/i);
  });
});

// ─── adminDelete / adminUnhide ────────────────────────────────────────────────

describe("drillsAdmin.adminDelete and adminUnhide", () => {
  it("soft-deletes a drill (sets isHidden = true)", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();

    await adminCaller.drillsAdmin.adminCreate({
      drillId,
      name: "Drill To Delete",
      difficulty: "Easy",
      categories: ["Hitting"],
    });

    const deleteResult = await adminCaller.drillsAdmin.adminDelete({ drillId });
    expect(deleteResult).toEqual({ success: true });

    // Verify it appears in the hidden filter
    const hiddenList = await adminCaller.drillsAdmin.adminList({
      page: 1,
      source: "hidden",
      search: drillId,
    });
    expect(hiddenList.drills.some((d) => d.drillId === drillId)).toBe(true);
  });

  it("unhides a previously hidden drill", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    await adminCaller.drillsAdmin.adminCreate({
      drillId,
      name: "Drill To Unhide",
      difficulty: "Easy",
      categories: ["Hitting"],
    });

    // Hide it
    await adminCaller.drillsAdmin.adminDelete({ drillId });

    // Unhide it
    const unhideResult = await adminCaller.drillsAdmin.adminUnhide({ drillId });
    expect(unhideResult).toEqual({ success: true });
  });
});

// ─── adminBulkCreate ──────────────────────────────────────────────────────────

describe("drillsAdmin.adminBulkCreate", () => {
  it("creates multiple drills from an array", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const id1 = testDrillId();
    const id2 = testDrillId();
    createdDrillIds.push(id1, id2);

    const result = await adminCaller.drillsAdmin.adminBulkCreate([
      { drillId: id1, name: "Bulk Drill One", difficulty: "Easy", categories: ["Hitting"] },
      { drillId: id2, name: "Bulk Drill Two", difficulty: "Medium", categories: ["Infield"] },
    ]);

    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ drillId: id1, success: true });
    expect(result.results[1]).toMatchObject({ drillId: id2, success: true });
  });

  it("reports errors for duplicate drillIds without stopping other inserts", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const goodId = testDrillId();
    const dupId = testDrillId();
    createdDrillIds.push(goodId, dupId);

    // Pre-create the dup drill
    await adminCaller.drillsAdmin.adminCreate({
      drillId: dupId,
      name: "Pre-existing Drill",
      difficulty: "Easy",
      categories: ["Hitting"],
    });

    const result = await adminCaller.drillsAdmin.adminBulkCreate([
      { drillId: goodId, name: "Good New Drill", difficulty: "Easy", categories: ["Hitting"] },
      { drillId: dupId, name: "Duplicate Drill", difficulty: "Easy", categories: ["Hitting"] },
    ]);

    expect(result.results).toHaveLength(2);
    const goodResult = result.results.find((r) => r.drillId === goodId);
    const dupResult = result.results.find((r) => r.drillId === dupId);

    expect(goodResult?.success).toBe(true);
    expect(dupResult?.success).toBe(false);
    expect(dupResult?.error).toBeDefined();
  });

  it("rejects bulk create from non-admin user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.drillsAdmin.adminBulkCreate([
        { name: "Forbidden Bulk Drill", difficulty: "Easy", categories: ["Hitting"] },
      ])
    ).rejects.toThrow();
  });
});

// ─── adminGet ─────────────────────────────────────────────────────────────────

describe("drillsAdmin.adminGet", () => {
  it("retrieves a single drill by drillId", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const drillId = testDrillId();
    createdDrillIds.push(drillId);

    await adminCaller.drillsAdmin.adminCreate({
      drillId,
      name: "Get Test Drill",
      difficulty: "Hard",
      categories: ["Pitching"],
      goalOfDrill: "Improve spin rate",
    });

    const drill = await adminCaller.drillsAdmin.adminGet({ drillId });

    expect(drill.drillId).toBe(drillId);
    expect(drill.name).toBe("Get Test Drill");
    expect(drill.difficulty).toBe("Hard");
    expect(drill.goalOfDrill).toBe("Improve spin rate");
  });

  it("throws NOT_FOUND for a non-existent drillId", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    await expect(
      adminCaller.drillsAdmin.adminGet({ drillId: "this-drill-does-not-exist-xyz" })
    ).rejects.toThrow(/not found/i);
  });
});
