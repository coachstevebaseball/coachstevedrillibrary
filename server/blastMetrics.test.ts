import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { blastPlayers, blastSessions, blastMetrics, sessionNotes, users } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create an admin context for tRPC calls
function createAdminContext(userId = 999999): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-blast-admin",
      email: "blastadmin@test.com",
      name: "Blast Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      get: () => "localhost",
    } as any,
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createNonAdminContext(): TrpcContext {
  return {
    user: {
      id: 999998,
      openId: "test-blast-user",
      email: "blastuser@test.com",
      name: "Blast User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      get: () => "localhost",
    } as any,
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Blast Metrics - Add Player", () => {
  let createdPlayerIds: string[] = [];

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    for (const id of createdPlayerIds) {
      await db.delete(blastSessions).where(eq(blastSessions.playerId, id));
      await db.delete(blastPlayers).where(eq(blastPlayers.id, id));
    }
    createdPlayerIds = [];
  });

  it("should add a new player as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addPlayer({ fullName: "Test Player 1" });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe("Test Player 1");
    createdPlayerIds.push(result.id);
  });

  it("should reject non-admin users from adding players", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(
      caller.blastMetrics.addPlayer({ fullName: "Unauthorized Player" })
    ).rejects.toThrow("Admin access required");
  });
});

describe("Blast Metrics - Add Session", () => {
  let testPlayerId: string;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    testPlayerId = `test-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test Session Player",
      userId: null,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    const sessions = await db
      .select({ id: blastSessions.id })
      .from(blastSessions)
      .where(eq(blastSessions.playerId, testPlayerId));
    for (const s of sessions) {
      await db.delete(sessionNotes).where(eq(sessionNotes.blastSessionId, s.id));
      await db.delete(blastMetrics).where(eq(blastMetrics.sessionId, s.id));
    }
    await db.delete(blastSessions).where(eq(blastSessions.playerId, testPlayerId));
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
  });

  it("should add a session with full metrics", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-20",
      sessionType: "Tee",
      metrics: {
        batSpeedMph: "65.5",
        rotationalAccelerationG: "12.3",
        planeScore: 78,
        connectionScore: 82,
        rotationScore: 75,
        powerKw: "1.85",
        peakHandSpeedMph: "22.0",
        onPlaneEfficiencyPercent: "85.0",
        attackAngleDeg: "10.5",
        earlyConnectionDeg: "95.0",
        connectionAtImpactDeg: "90.0",
        verticalBatAngleDeg: "-25.0",
        timeToContactSec: "0.150",
      },
    });

    expect(result.sessionId).toBeDefined();

    // Verify session was created
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [session] = await db
      .select()
      .from(blastSessions)
      .where(eq(blastSessions.id, result.sessionId));
    expect(session).toBeDefined();
    expect(session.playerId).toBe(testPlayerId);
    expect(session.sessionType).toBe("Tee");

    // Verify metrics were created
    const [metrics] = await db
      .select()
      .from(blastMetrics)
      .where(eq(blastMetrics.sessionId, result.sessionId));
    expect(metrics).toBeDefined();
    expect(metrics.batSpeedMph).toBe("65.5");
    expect(metrics.planeScore).toBe(78);
    expect(metrics.connectionScore).toBe(82);
    expect(metrics.rotationScore).toBe(75);
    expect(metrics.powerKw).toBe("1.85");
  });

  it("should add a session with partial metrics (only bat speed)", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-21",
      sessionType: "Soft Toss",
      metrics: {
        batSpeedMph: "48.0",
      },
    });

    expect(result.sessionId).toBeDefined();

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [metrics] = await db
      .select()
      .from(blastMetrics)
      .where(eq(blastMetrics.sessionId, result.sessionId));
    expect(metrics).toBeDefined();
    expect(metrics.batSpeedMph).toBe("48.0");
    expect(metrics.planeScore).toBeNull();
    expect(metrics.connectionScore).toBeNull();
  });

  it("should add a session with empty metrics", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-22",
      sessionType: "Live BP",
      metrics: {},
    });

    expect(result.sessionId).toBeDefined();

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [metrics] = await db
      .select()
      .from(blastMetrics)
      .where(eq(blastMetrics.sessionId, result.sessionId));
    expect(metrics).toBeDefined();
    expect(metrics.batSpeedMph).toBeNull();
    expect(metrics.planeScore).toBeNull();
    expect(metrics.powerKw).toBeNull();
  });

  it("should NOT auto-create session note when player has no userId", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-20",
      sessionType: "Tee",
      createSessionNote: true,
      metrics: { batSpeedMph: "60.0" },
    });

    expect(result.sessionId).toBeDefined();
    expect(result.linkedSessionNoteId).toBeNull();

    // Verify no session note was created
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const notes = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.blastSessionId, result.sessionId));
    expect(notes).toHaveLength(0);
  });

  it("should reject non-admin users from adding sessions", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(
      caller.blastMetrics.addSession({
        playerId: testPlayerId,
        sessionDate: "2026-02-20",
        sessionType: "Tee",
        metrics: { batSpeedMph: "50.0" },
      })
    ).rejects.toThrow("Admin access required");
  });
});

describe("Blast Metrics - Add Session with Linked User (auto session note)", () => {
  let testPlayerId: string;
  let testUserId: number;
  const testOpenId = `test-linked-user-${Date.now()}`;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user in the users table
    const [userResult] = await db.insert(users).values({
      openId: testOpenId,
      name: "Test Linked Athlete",
      email: "linked-athlete@test.com",
      loginMethod: "manus",
      role: "athlete",
    });
    testUserId = userResult.insertId;

    // Create a Blast player linked to that user
    testPlayerId = `test-linked-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test Linked Athlete",
      userId: testUserId,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    const sessions = await db
      .select({ id: blastSessions.id })
      .from(blastSessions)
      .where(eq(blastSessions.playerId, testPlayerId));
    for (const s of sessions) {
      await db.delete(sessionNotes).where(eq(sessionNotes.blastSessionId, s.id));
      await db.delete(blastMetrics).where(eq(blastMetrics.sessionId, s.id));
    }
    await db.delete(blastSessions).where(eq(blastSessions.playerId, testPlayerId));
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
    // Clean up session notes for this athlete
    await db.delete(sessionNotes).where(eq(sessionNotes.athleteId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should auto-create a linked session note when player has userId", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-20",
      sessionType: "Tee",
      createSessionNote: true,
      metrics: {
        batSpeedMph: "65.0",
        planeScore: 80,
        connectionScore: 75,
      },
    });

    expect(result.sessionId).toBeDefined();
    expect(result.linkedSessionNoteId).toBeDefined();
    expect(result.linkedSessionNoteId).not.toBeNull();

    // Verify session note was created with correct data
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [note] = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.blastSessionId, result.sessionId));
    expect(note).toBeDefined();
    expect(note.athleteId).toBe(testUserId);
    expect(note.blastSessionId).toBe(result.sessionId);
    expect(note.sessionLabel).toContain("Blast");
    expect(note.sessionLabel).toContain("Tee");
    expect(note.whatImproved).toContain("Bat Speed: 65.0 mph");
    expect(note.whatImproved).toContain("Plane: 80");
    expect(note.whatImproved).toContain("Connection: 75");
  });

  it("should NOT create session note when createSessionNote is false", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-20",
      sessionType: "Soft Toss",
      createSessionNote: false,
      metrics: { batSpeedMph: "55.0" },
    });

    expect(result.sessionId).toBeDefined();
    expect(result.linkedSessionNoteId).toBeNull();

    // Verify no session note was created
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const notes = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.blastSessionId, result.sessionId));
    expect(notes).toHaveLength(0);
  });
});

describe("Blast Metrics - Delete Session (with linked note cleanup)", () => {
  let testPlayerId: string;
  let testSessionId: string;
  let testUserId: number;
  const testOpenId = `test-del-linked-user-${Date.now()}`;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [userResult] = await db.insert(users).values({
      openId: testOpenId,
      name: "Test Delete Linked",
      email: "del-linked@test.com",
      loginMethod: "manus",
      role: "athlete",
    });
    testUserId = userResult.insertId;

    testPlayerId = `test-del-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test Delete Player",
      userId: testUserId,
    });

    testSessionId = `test-del-session-${Date.now()}`;
    await db.insert(blastSessions).values({
      id: testSessionId,
      playerId: testPlayerId,
      sessionDate: new Date("2026-02-20"),
      sessionType: "Tee",
    });
    await db.insert(blastMetrics).values({
      sessionId: testSessionId,
      batSpeedMph: "55.0",
      planeScore: 70,
    });
    // Create a linked session note
    await db.insert(sessionNotes).values({
      coachId: 999999,
      athleteId: testUserId,
      sessionNumber: 1,
      sessionLabel: "Blast Tee Session",
      sessionDate: new Date("2026-02-20"),
      skillsWorked: JSON.stringify(["Swing Mechanics"]),
      whatImproved: "Bat Speed: 55.0 mph",
      whatNeedsWork: "See Blast Motion metrics",
      homeworkDrills: JSON.stringify([]),
      blastSessionId: testSessionId,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(sessionNotes).where(eq(sessionNotes.blastSessionId, testSessionId));
    await db.delete(blastMetrics).where(eq(blastMetrics.sessionId, testSessionId));
    await db.delete(blastSessions).where(eq(blastSessions.id, testSessionId));
    await db.delete(blastSessions).where(eq(blastSessions.playerId, testPlayerId));
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
    await db.delete(sessionNotes).where(eq(sessionNotes.athleteId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should delete session, metrics, AND linked session note", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.deleteSession({ sessionId: testSessionId });

    expect(result.success).toBe(true);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Session gone
    const sessions = await db
      .select()
      .from(blastSessions)
      .where(eq(blastSessions.id, testSessionId));
    expect(sessions).toHaveLength(0);

    // Metrics gone
    const metrics = await db
      .select()
      .from(blastMetrics)
      .where(eq(blastMetrics.sessionId, testSessionId));
    expect(metrics).toHaveLength(0);

    // Linked session note gone
    const notes = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.blastSessionId, testSessionId));
    expect(notes).toHaveLength(0);
  });

  it("should reject non-admin users from deleting sessions", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(
      caller.blastMetrics.deleteSession({ sessionId: testSessionId })
    ).rejects.toThrow("Admin access required");
  });

  it("should handle deleting a non-existent session gracefully", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.deleteSession({ sessionId: "non-existent-session-id" });
    expect(result.success).toBe(true);
  });
});

describe("Blast Metrics - Link/Unlink Player", () => {
  let testPlayerId: string;
  let testUserId: number;
  const testOpenId = `test-link-user-${Date.now()}`;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [userResult] = await db.insert(users).values({
      openId: testOpenId,
      name: "Test Link Athlete",
      email: "link-athlete@test.com",
      loginMethod: "manus",
      role: "athlete",
    });
    testUserId = userResult.insertId;

    testPlayerId = `test-link-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test Link Player",
      userId: null,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should link a Blast player to a portal user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.linkPlayer({
      playerId: testPlayerId,
      userId: testUserId,
    });

    expect(result.success).toBe(true);

    // Verify the link
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [player] = await db
      .select()
      .from(blastPlayers)
      .where(eq(blastPlayers.id, testPlayerId));
    expect(player.userId).toBe(testUserId);
  });

  it("should unlink a Blast player from a portal user", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // First link
    await db.update(blastPlayers).set({ userId: testUserId }).where(eq(blastPlayers.id, testPlayerId));

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.unlinkPlayer({ playerId: testPlayerId });

    expect(result.success).toBe(true);

    const [player] = await db
      .select()
      .from(blastPlayers)
      .where(eq(blastPlayers.id, testPlayerId));
    expect(player.userId).toBeNull();
  });

  it("should reject non-admin users from linking players", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(
      caller.blastMetrics.linkPlayer({ playerId: testPlayerId, userId: testUserId })
    ).rejects.toThrow("Admin access required");
  });

  it("should reject non-admin users from unlinking players", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(
      caller.blastMetrics.unlinkPlayer({ playerId: testPlayerId })
    ).rejects.toThrow("Admin access required");
  });
});

describe("Blast Metrics - List Players", () => {
  let testPlayerId: string;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    testPlayerId = `test-list-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test List Player",
      userId: null,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(blastSessions).where(eq(blastSessions.playerId, testPlayerId));
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
  });

  it("should list players with session counts", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const players = await caller.blastMetrics.listPlayers();

    expect(Array.isArray(players)).toBe(true);
    const testPlayer = players.find((p: any) => p.id === testPlayerId);
    expect(testPlayer).toBeDefined();
    expect(testPlayer!.fullName).toBe("Test List Player");
    expect(testPlayer!.sessionCount).toBe(0);
  });

  it("should reject non-admin users from listing players", async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.blastMetrics.listPlayers()).rejects.toThrow("Admin access required");
  });
});

describe("Blast Metrics - getPlayerSessions with hasLinkedNote", () => {
  let testPlayerId: string;
  let testUserId: number;
  const testOpenId = `test-linked-note-${Date.now()}`;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [userResult] = await db.insert(users).values({
      openId: testOpenId,
      name: "Test Note Athlete",
      email: "note-athlete@test.com",
      loginMethod: "manus",
      role: "athlete",
    });
    testUserId = userResult.insertId;

    testPlayerId = `test-note-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test Note Player",
      userId: testUserId,
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    const sessions = await db
      .select({ id: blastSessions.id })
      .from(blastSessions)
      .where(eq(blastSessions.playerId, testPlayerId));
    for (const s of sessions) {
      await db.delete(sessionNotes).where(eq(sessionNotes.blastSessionId, s.id));
      await db.delete(blastMetrics).where(eq(blastMetrics.sessionId, s.id));
    }
    await db.delete(blastSessions).where(eq(blastSessions.playerId, testPlayerId));
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
    await db.delete(sessionNotes).where(eq(sessionNotes.athleteId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should return hasLinkedNote=true for sessions with linked notes", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Add session with auto-create note
    const result = await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-20",
      sessionType: "Tee",
      createSessionNote: true,
      metrics: { batSpeedMph: "60.0" },
    });

    expect(result.linkedSessionNoteId).not.toBeNull();

    // Fetch sessions and check hasLinkedNote
    const sessions = await caller.blastMetrics.getPlayerSessions({
      playerId: testPlayerId,
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].hasLinkedNote).toBe(true);
  });

  it("should return hasLinkedNote=false for sessions without linked notes", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Add session WITHOUT creating note
    await caller.blastMetrics.addSession({
      playerId: testPlayerId,
      sessionDate: "2026-02-20",
      sessionType: "Tee",
      createSessionNote: false,
      metrics: { batSpeedMph: "60.0" },
    });

    const sessions = await caller.blastMetrics.getPlayerSessions({
      playerId: testPlayerId,
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].hasLinkedNote).toBe(false);
  });
});
