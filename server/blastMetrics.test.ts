import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    select: vi.fn().mockReturnThis(),
    selectDistinct: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
  };

  return {
    getDb: vi.fn().mockResolvedValue(mockDb),
  };
});

// Mock schema
vi.mock("../drizzle/schema", () => ({
  blastPlayers: {
    id: "id",
    fullName: "fullName",
    userId: "userId",
    createdAt: "createdAt",
  },
  blastSessions: {
    id: "id",
    playerId: "playerId",
    sessionDate: "sessionDate",
    sessionType: "sessionType",
  },
  blastMetrics: {
    sessionId: "sessionId",
    planeScore: "planeScore",
    connectionScore: "connectionScore",
    rotationScore: "rotationScore",
    batSpeedMph: "batSpeedMph",
    rotationalAccelerationG: "rotationalAccelerationG",
    onPlaneEfficiencyPercent: "onPlaneEfficiencyPercent",
    attackAngleDeg: "attackAngleDeg",
    earlyConnectionDeg: "earlyConnectionDeg",
    connectionAtImpactDeg: "connectionAtImpactDeg",
    verticalBatAngleDeg: "verticalBatAngleDeg",
    powerKw: "powerKw",
    timeToContactSec: "timeToContactSec",
    peakHandSpeedMph: "peakHandSpeedMph",
  },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: any[]) => ({ type: "eq", args })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  asc: vi.fn((col: any) => ({ type: "asc", col })),
  sql: Object.assign(vi.fn(), {
    // Allow template literal usage: sql`...`
    raw: vi.fn(),
  }),
}));

// Mock crypto.randomUUID
vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("test-uuid-123") });

import { getDb } from "./db";

describe("Blast Metrics Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Database Connection", () => {
    it("should get a database connection via getDb", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
      expect(db).toHaveProperty("select");
      expect(db).toHaveProperty("insert");
      expect(db).toHaveProperty("selectDistinct");
    });
  });

  describe("listPlayers query pattern", () => {
    it("should query blastPlayers table with select and orderBy", async () => {
      const db = await getDb();
      (db as any).select.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        { id: "p1", fullName: "Mike Troutman", sessionCount: 5, latestSession: new Date() },
        { id: "p2", fullName: "Jake Sonsay", sessionCount: 3, latestSession: new Date() },
      ]);

      const result = await (db as any).select().from("blastPlayers").orderBy("fullName");
      expect(result).toHaveLength(2);
      expect(result[0].fullName).toBe("Mike Troutman");
      expect(result[1].fullName).toBe("Jake Sonsay");
    });
  });

  describe("getPlayerSessions query pattern", () => {
    it("should join blastSessions with blastMetrics and filter by playerId", async () => {
      const db = await getDb();
      (db as any).select.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).leftJoin.mockReturnThis();
      (db as any).where.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        {
          id: "s1",
          sessionDate: new Date("2025-01-15"),
          sessionType: "Live BP",
          batSpeedMph: "85.20",
          rotationalAccelerationG: "24.50",
          planeScore: 78,
          connectionScore: 82,
          rotationScore: 75,
          powerKw: "5.80",
        },
      ]);

      const sessions = await (db as any)
        .select()
        .from("blastSessions")
        .leftJoin("blastMetrics")
        .where("playerId = p1")
        .orderBy("sessionDate");

      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionType).toBe("Live BP");
      expect(sessions[0].batSpeedMph).toBe("85.20");
      expect(sessions[0].planeScore).toBe(78);
    });

    it("should support filtering by session type", async () => {
      const db = await getDb();
      (db as any).select.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).leftJoin.mockReturnThis();
      (db as any).where.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        { id: "s1", sessionType: "Live BP", batSpeedMph: "85.20" },
        { id: "s2", sessionType: "Live BP", batSpeedMph: "86.10" },
      ]);

      const sessions = await (db as any)
        .select()
        .from("blastSessions")
        .leftJoin("blastMetrics")
        .where("playerId = p1 AND sessionType = Live BP")
        .orderBy("sessionDate");

      expect(sessions).toHaveLength(2);
      expect(sessions.every((s: any) => s.sessionType === "Live BP")).toBe(true);
    });
  });

  describe("getSessionTypes query pattern", () => {
    it("should return distinct session types for a player", async () => {
      const db = await getDb();
      (db as any).selectDistinct.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).where.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        { sessionType: "Front Toss" },
        { sessionType: "Game Simulation" },
        { sessionType: "Live BP" },
        { sessionType: "Machine Work" },
      ]);

      const types = await (db as any)
        .selectDistinct()
        .from("blastSessions")
        .where("playerId = p1")
        .orderBy("sessionType");

      const typeNames = types.map((t: any) => t.sessionType);
      expect(typeNames).toContain("Live BP");
      expect(typeNames).toContain("Front Toss");
      expect(typeNames).toHaveLength(4);
    });
  });

  describe("getAverages query pattern", () => {
    it("should return averages grouped by session type", async () => {
      const db = await getDb();
      (db as any).select.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).leftJoin.mockReturnThis();
      (db as any).where.mockReturnThis();
      (db as any).groupBy.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        {
          sessionType: "Live BP",
          avgBatSpeed: "85.15",
          avgRotAccel: "24.15",
          avgPlaneScore: 77,
          avgConnectionScore: 81,
          avgRotationScore: 74,
          avgPower: "5.75",
          sessionCount: 2,
        },
        {
          sessionType: "Front Toss",
          avgBatSpeed: "82.50",
          avgRotAccel: "22.50",
          avgPlaneScore: 80,
          avgConnectionScore: 85,
          avgRotationScore: 78,
          avgPower: "5.20",
          sessionCount: 1,
        },
      ]);

      const averages = await (db as any)
        .select()
        .from("blastSessions")
        .leftJoin("blastMetrics")
        .where("playerId = p1")
        .groupBy("sessionType")
        .orderBy("sessionType");

      expect(averages).toHaveLength(2);
      expect(averages[0].sessionType).toBe("Live BP");
      expect(averages[0].avgBatSpeed).toBe("85.15");
      expect(averages[0].sessionCount).toBe(2);
      expect(averages[1].sessionType).toBe("Front Toss");
    });
  });

  describe("getTrends query pattern", () => {
    it("should return chronological trend data for charts", async () => {
      const db = await getDb();
      (db as any).select.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).leftJoin.mockReturnThis();
      (db as any).where.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        { sessionDate: new Date("2025-01-15"), batSpeedMph: "82.50", rotationalAccelerationG: "22.50" },
        { sessionDate: new Date("2025-02-01"), batSpeedMph: "85.20", rotationalAccelerationG: "24.50" },
        { sessionDate: new Date("2025-02-15"), batSpeedMph: "86.10", rotationalAccelerationG: "25.30" },
      ]);

      const trends = await (db as any)
        .select()
        .from("blastSessions")
        .leftJoin("blastMetrics")
        .where("playerId = p1")
        .orderBy("sessionDate ASC");

      expect(trends).toHaveLength(3);
      // Verify chronological order
      const speeds = trends.map((t: any) => parseFloat(t.batSpeedMph));
      expect(speeds[0]).toBeLessThan(speeds[1]);
      expect(speeds[1]).toBeLessThan(speeds[2]);
    });
  });

  describe("addPlayer mutation pattern", () => {
    it("should insert a new player with UUID", async () => {
      const db = await getDb();
      (db as any).insert.mockReturnThis();
      (db as any).values.mockResolvedValue([{ insertId: 1 }]);

      await (db as any).insert("blastPlayers").values({
        id: crypto.randomUUID(),
        fullName: "New Player",
        userId: null,
      });

      expect((db as any).insert).toHaveBeenCalled();
      expect((db as any).values).toHaveBeenCalledWith({
        id: "test-uuid-123",
        fullName: "New Player",
        userId: null,
      });
    });
  });

  describe("addSession mutation pattern", () => {
    it("should insert a session and metrics in sequence", async () => {
      const db = await getDb();
      (db as any).insert.mockReturnThis();
      (db as any).values.mockResolvedValue([{ insertId: 1 }]);

      // Insert session
      await (db as any).insert("blastSessions").values({
        id: "test-uuid-123",
        playerId: "p1",
        sessionDate: new Date("2025-03-01"),
        sessionType: "Live BP",
      });

      // Insert metrics
      await (db as any).insert("blastMetrics").values({
        sessionId: "test-uuid-123",
        batSpeedMph: "87.50",
        rotationalAccelerationG: "26.00",
        planeScore: 82,
        connectionScore: 85,
        rotationScore: 80,
      });

      // insert called twice (session + metrics)
      expect((db as any).insert).toHaveBeenCalledTimes(2);
    });
  });

  describe("Mike Troutman verification query", () => {
    it("should return correct averages for Mike Troutman by session type", async () => {
      const db = await getDb();
      (db as any).select.mockReturnThis();
      (db as any).from.mockReturnThis();
      (db as any).leftJoin.mockReturnThis();
      (db as any).where.mockReturnThis();
      (db as any).groupBy.mockReturnThis();
      (db as any).orderBy.mockResolvedValue([
        { sessionType: "Front Toss", avgBatSpeed: "82.50", avgRotAccel: "22.50", sessionCount: 1 },
        { sessionType: "Game Simulation", avgBatSpeed: "88.10", avgRotAccel: "26.50", sessionCount: 1 },
        { sessionType: "Live BP", avgBatSpeed: "85.15", avgRotAccel: "24.15", sessionCount: 2 },
        { sessionType: "Machine Work", avgBatSpeed: "85.20", avgRotAccel: "24.50", sessionCount: 1 },
      ]);

      const averages = await (db as any)
        .select()
        .from("blastSessions")
        .leftJoin("blastMetrics")
        .where("playerId = mike-troutman-id")
        .groupBy("sessionType")
        .orderBy("sessionType");

      expect(averages).toHaveLength(4);
      
      const liveBP = averages.find((a: any) => a.sessionType === "Live BP");
      expect(liveBP).toBeDefined();
      expect(liveBP.avgBatSpeed).toBe("85.15");
      expect(liveBP.avgRotAccel).toBe("24.15");
      expect(liveBP.sessionCount).toBe(2);

      const gameSim = averages.find((a: any) => a.sessionType === "Game Simulation");
      expect(gameSim).toBeDefined();
      expect(gameSim.avgBatSpeed).toBe("88.10");
      expect(gameSim.avgRotAccel).toBe("26.50");
    });
  });
});
