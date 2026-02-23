import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { blastPlayers, blastSessions, blastMetrics } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create an admin context for tRPC calls
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 999999,
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
    } as TrpcContext["req"],
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
    } as TrpcContext["req"],
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

describe("Blast Metrics - Delete Session", () => {
  let testPlayerId: string;
  let testSessionId: string;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    testPlayerId = `test-del-player-${Date.now()}`;
    await db.insert(blastPlayers).values({
      id: testPlayerId,
      fullName: "Test Delete Player",
      userId: null,
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
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(blastMetrics).where(eq(blastMetrics.sessionId, testSessionId));
    await db.delete(blastSessions).where(eq(blastSessions.id, testSessionId));
    await db.delete(blastSessions).where(eq(blastSessions.playerId, testPlayerId));
    await db.delete(blastPlayers).where(eq(blastPlayers.id, testPlayerId));
  });

  it("should delete a session and its metrics", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.blastMetrics.deleteSession({ sessionId: testSessionId });

    expect(result.success).toBe(true);

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const sessions = await db
      .select()
      .from(blastSessions)
      .where(eq(blastSessions.id, testSessionId));
    expect(sessions).toHaveLength(0);

    const metrics = await db
      .select()
      .from(blastMetrics)
      .where(eq(blastMetrics.sessionId, testSessionId));
    expect(metrics).toHaveLength(0);
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
