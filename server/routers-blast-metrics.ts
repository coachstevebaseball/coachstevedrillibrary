import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { blastPlayers, blastSessions, blastMetrics } from "../drizzle/schema";
import { eq, asc, and, sql } from "drizzle-orm";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

export const blastMetricsRouter = router({
  /** List all Blast Motion players */
  listPlayers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    const db = await requireDb();
    const players = await db
      .select({
        id: blastPlayers.id,
        fullName: blastPlayers.fullName,
        userId: blastPlayers.userId,
        createdAt: blastPlayers.createdAt,
        sessionCount: sql<number>`COUNT(${blastSessions.id})`.mapWith(Number),
        latestSession: sql<Date | null>`MAX(${blastSessions.sessionDate})`,
      })
      .from(blastPlayers)
      .leftJoin(blastSessions, eq(blastSessions.playerId, blastPlayers.id))
      .groupBy(blastPlayers.id, blastPlayers.fullName, blastPlayers.userId, blastPlayers.createdAt)
      .orderBy(asc(blastPlayers.fullName));
    return players;
  }),

  /** Get a single player's details */
  getPlayer: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      const [player] = await db
        .select()
        .from(blastPlayers)
        .where(eq(blastPlayers.id, input.playerId));
      if (!player) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });
      }
      return player;
    }),

  /** Get all sessions for a player, with metrics joined */
  getPlayerSessions: protectedProcedure
    .input(
      z.object({
        playerId: z.string(),
        sessionType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();

      const conditions = [eq(blastSessions.playerId, input.playerId)];
      if (input.sessionType && input.sessionType !== "All") {
        conditions.push(eq(blastSessions.sessionType, input.sessionType));
      }

      const sessions = await db
        .select({
          id: blastSessions.id,
          sessionDate: blastSessions.sessionDate,
          sessionType: blastSessions.sessionType,
          planeScore: blastMetrics.planeScore,
          connectionScore: blastMetrics.connectionScore,
          rotationScore: blastMetrics.rotationScore,
          batSpeedMph: blastMetrics.batSpeedMph,
          rotationalAccelerationG: blastMetrics.rotationalAccelerationG,
          onPlaneEfficiencyPercent: blastMetrics.onPlaneEfficiencyPercent,
          attackAngleDeg: blastMetrics.attackAngleDeg,
          earlyConnectionDeg: blastMetrics.earlyConnectionDeg,
          connectionAtImpactDeg: blastMetrics.connectionAtImpactDeg,
          verticalBatAngleDeg: blastMetrics.verticalBatAngleDeg,
          powerKw: blastMetrics.powerKw,
          timeToContactSec: blastMetrics.timeToContactSec,
          peakHandSpeedMph: blastMetrics.peakHandSpeedMph,
        })
        .from(blastSessions)
        .leftJoin(blastMetrics, eq(blastMetrics.sessionId, blastSessions.id))
        .where(and(...conditions))
        .orderBy(asc(blastSessions.sessionDate));

      return sessions;
    }),

  /** Get unique session types for a player (for filter dropdown) */
  getSessionTypes: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      const types = await db
        .selectDistinct({ sessionType: blastSessions.sessionType })
        .from(blastSessions)
        .where(eq(blastSessions.playerId, input.playerId))
        .orderBy(asc(blastSessions.sessionType));
      return types.map((t: { sessionType: string | null }) => t.sessionType).filter(Boolean) as string[];
    }),

  /** Get trend data for a player */
  getTrends: protectedProcedure
    .input(
      z.object({
        playerId: z.string(),
        sessionType: z.string().optional(),
        metric: z.enum(["batSpeed", "rotationalAcceleration", "planeScore", "connectionScore", "rotationScore", "power"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();

      const conditions = [eq(blastSessions.playerId, input.playerId)];
      if (input.sessionType && input.sessionType !== "All") {
        conditions.push(eq(blastSessions.sessionType, input.sessionType));
      }

      const data = await db
        .select({
          sessionDate: blastSessions.sessionDate,
          sessionType: blastSessions.sessionType,
          batSpeedMph: blastMetrics.batSpeedMph,
          rotationalAccelerationG: blastMetrics.rotationalAccelerationG,
          planeScore: blastMetrics.planeScore,
          connectionScore: blastMetrics.connectionScore,
          rotationScore: blastMetrics.rotationScore,
          powerKw: blastMetrics.powerKw,
          onPlaneEfficiencyPercent: blastMetrics.onPlaneEfficiencyPercent,
          attackAngleDeg: blastMetrics.attackAngleDeg,
          peakHandSpeedMph: blastMetrics.peakHandSpeedMph,
        })
        .from(blastSessions)
        .leftJoin(blastMetrics, eq(blastMetrics.sessionId, blastSessions.id))
        .where(and(...conditions))
        .orderBy(asc(blastSessions.sessionDate));

      return data;
    }),

  /** Get averages for a player, grouped by session type */
  getAverages: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();

      const averages = await db
        .select({
          sessionType: blastSessions.sessionType,
          avgBatSpeed: sql<string>`ROUND(AVG(CAST(${blastMetrics.batSpeedMph} AS DECIMAL(5,2))), 2)`,
          avgRotAccel: sql<string>`ROUND(AVG(CAST(${blastMetrics.rotationalAccelerationG} AS DECIMAL(5,2))), 2)`,
          avgPlaneScore: sql<number>`ROUND(AVG(${blastMetrics.planeScore}), 0)`,
          avgConnectionScore: sql<number>`ROUND(AVG(${blastMetrics.connectionScore}), 0)`,
          avgRotationScore: sql<number>`ROUND(AVG(${blastMetrics.rotationScore}), 0)`,
          avgPower: sql<string>`ROUND(AVG(CAST(${blastMetrics.powerKw} AS DECIMAL(5,2))), 2)`,
          sessionCount: sql<number>`COUNT(*)`,
        })
        .from(blastSessions)
        .leftJoin(blastMetrics, eq(blastMetrics.sessionId, blastSessions.id))
        .where(eq(blastSessions.playerId, input.playerId))
        .groupBy(blastSessions.sessionType)
        .orderBy(asc(blastSessions.sessionType));

      return averages;
    }),

  /** Add a new player */
  addPlayer: protectedProcedure
    .input(z.object({ fullName: z.string().min(1), userId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      const id = crypto.randomUUID();
      await db.insert(blastPlayers).values({
        id,
        fullName: input.fullName,
        userId: input.userId ?? null,
      });
      return { id, fullName: input.fullName };
    }),

  /** Add a session with metrics for a player */
  addSession: protectedProcedure
    .input(
      z.object({
        playerId: z.string(),
        sessionDate: z.string(),
        sessionType: z.string(),
        metrics: z.object({
          planeScore: z.number().optional(),
          connectionScore: z.number().optional(),
          rotationScore: z.number().optional(),
          batSpeedMph: z.string().optional(),
          rotationalAccelerationG: z.string().optional(),
          onPlaneEfficiencyPercent: z.string().optional(),
          attackAngleDeg: z.string().optional(),
          earlyConnectionDeg: z.string().optional(),
          connectionAtImpactDeg: z.string().optional(),
          verticalBatAngleDeg: z.string().optional(),
          powerKw: z.string().optional(),
          timeToContactSec: z.string().optional(),
          peakHandSpeedMph: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      const sessionId = crypto.randomUUID();
      await db.insert(blastSessions).values({
        id: sessionId,
        playerId: input.playerId,
        sessionDate: new Date(input.sessionDate),
        sessionType: input.sessionType,
      });
      await db.insert(blastMetrics).values({
        sessionId,
        planeScore: input.metrics.planeScore ?? null,
        connectionScore: input.metrics.connectionScore ?? null,
        rotationScore: input.metrics.rotationScore ?? null,
        batSpeedMph: input.metrics.batSpeedMph ?? null,
        rotationalAccelerationG: input.metrics.rotationalAccelerationG ?? null,
        onPlaneEfficiencyPercent: input.metrics.onPlaneEfficiencyPercent ?? null,
        attackAngleDeg: input.metrics.attackAngleDeg ?? null,
        earlyConnectionDeg: input.metrics.earlyConnectionDeg ?? null,
        connectionAtImpactDeg: input.metrics.connectionAtImpactDeg ?? null,
        verticalBatAngleDeg: input.metrics.verticalBatAngleDeg ?? null,
        powerKw: input.metrics.powerKw ?? null,
        timeToContactSec: input.metrics.timeToContactSec ?? null,
        peakHandSpeedMph: input.metrics.peakHandSpeedMph ?? null,
      });
      return { sessionId };
    }),
});
