import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { blastPlayers, blastSessions, blastMetrics, users, sessionNotes } from "../drizzle/schema";
import { eq, asc, and, sql, desc } from "drizzle-orm";
import * as sessionNotesDb from "./sessionNotes";

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
        blastEmail: blastPlayers.blastEmail,
        createdAt: blastPlayers.createdAt,
        sessionCount: sql<number>`COUNT(DISTINCT ${blastSessions.id})`.mapWith(Number),
        latestSession: sql<Date | null>`MAX(${blastSessions.sessionDate})`,
        portalName: users.name,
        portalEmail: users.email,
      })
      .from(blastPlayers)
      .leftJoin(blastSessions, eq(blastSessions.playerId, blastPlayers.id))
      .leftJoin(users, eq(users.id, blastPlayers.userId))
      .groupBy(blastPlayers.id, blastPlayers.fullName, blastPlayers.userId, blastPlayers.blastEmail, blastPlayers.createdAt, users.name, users.email)
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
        .select({
          id: blastPlayers.id,
          fullName: blastPlayers.fullName,
          userId: blastPlayers.userId,
          blastEmail: blastPlayers.blastEmail,
          createdAt: blastPlayers.createdAt,
          portalName: users.name,
          portalEmail: users.email,
        })
        .from(blastPlayers)
        .leftJoin(users, eq(users.id, blastPlayers.userId))
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
          linkedNoteId: sessionNotes.id,
        })
        .from(blastSessions)
        .leftJoin(blastMetrics, eq(blastMetrics.sessionId, blastSessions.id))
        .leftJoin(sessionNotes, eq(sessionNotes.blastSessionId, blastSessions.id))
        .where(and(...conditions))
        .orderBy(asc(blastSessions.sessionDate));

      return sessions.map(s => ({
        ...s,
        hasLinkedNote: !!s.linkedNoteId,
      }));
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

  /** Link a Blast player to a portal user account */
  linkPlayer: protectedProcedure
    .input(z.object({ playerId: z.string(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      await db.update(blastPlayers).set({ userId: input.userId }).where(eq(blastPlayers.id, input.playerId));
      return { success: true };
    }),

  /** Unlink a Blast player from their portal user account */
  unlinkPlayer: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      await db.update(blastPlayers).set({ userId: null }).where(eq(blastPlayers.id, input.playerId));
      return { success: true };
    }),

  /** Get the linked session note for a Blast session */
  getLinkedSessionNote: protectedProcedure
    .input(z.object({ blastSessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      const [note] = await db
        .select()
        .from(sessionNotes)
        .where(eq(sessionNotes.blastSessionId, input.blastSessionId))
        .limit(1);
      return note ?? null;
    }),

  /** Get Blast metrics for a session note (reverse lookup) */
  getBlastDataForSessionNote: protectedProcedure
    .input(z.object({ blastSessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      const [session] = await db
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
        .where(eq(blastSessions.id, input.blastSessionId))
        .limit(1);
      return session ?? null;
    }),

  /** Add a session with metrics for a player, auto-create linked session note if player has userId */
  addSession: protectedProcedure
    .input(
      z.object({
        playerId: z.string(),
        sessionDate: z.string(),
        sessionType: z.string(),
        createSessionNote: z.boolean().optional(), // explicitly opt-in/out
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

      // Auto-create a linked session note if the player is linked to a portal user
      let linkedSessionNoteId: number | null = null;
      const shouldCreateNote = input.createSessionNote !== false; // default true
      if (shouldCreateNote) {
        const [player] = await db
          .select({ userId: blastPlayers.userId, fullName: blastPlayers.fullName })
          .from(blastPlayers)
          .where(eq(blastPlayers.id, input.playerId))
          .limit(1);

        if (player?.userId) {
          const sessionNumber = await sessionNotesDb.getNextSessionNumber(player.userId);
          // Build a summary of metrics for the session note
          const metricsSummary: string[] = [];
          if (input.metrics.batSpeedMph) metricsSummary.push(`Bat Speed: ${input.metrics.batSpeedMph} mph`);
          if (input.metrics.rotationalAccelerationG) metricsSummary.push(`Rot. Accel: ${input.metrics.rotationalAccelerationG} g`);
          if (input.metrics.planeScore != null) metricsSummary.push(`Plane: ${input.metrics.planeScore}`);
          if (input.metrics.connectionScore != null) metricsSummary.push(`Connection: ${input.metrics.connectionScore}`);
          if (input.metrics.rotationScore != null) metricsSummary.push(`Rotation: ${input.metrics.rotationScore}`);
          if (input.metrics.powerKw) metricsSummary.push(`Power: ${input.metrics.powerKw} kW`);
          if (input.metrics.peakHandSpeedMph) metricsSummary.push(`Peak Hand Speed: ${input.metrics.peakHandSpeedMph} mph`);

          const metricsText = metricsSummary.length > 0
            ? `Session Blast Metrics: ${metricsSummary.join(", ")}`
            : "Blast session recorded (no metrics entered)";

          const note = await sessionNotesDb.createSessionNote({
            coachId: ctx.user.id,
            athleteId: player.userId,
            sessionNumber,
            sessionLabel: `Blast ${input.sessionType} Session`,
            sessionDate: new Date(input.sessionDate),
            duration: null,
            skillsWorked: ["Swing Mechanics"],
            whatImproved: metricsText,
            whatNeedsWork: "",
            homeworkDrills: [],
            overallRating: null,
            privateNotes: null,
            practicePlanId: null,
            blastSessionId: sessionId,
          });
          linkedSessionNoteId = note?.id ?? null;
        }
      }

      return { sessionId, linkedSessionNoteId };
    }),

  /** Update a session's date, type, and metrics */
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        sessionDate: z.string().optional(),
        sessionType: z.string().optional(),
        metrics: z.object({
          planeScore: z.number().nullable().optional(),
          connectionScore: z.number().nullable().optional(),
          rotationScore: z.number().nullable().optional(),
          batSpeedMph: z.string().nullable().optional(),
          rotationalAccelerationG: z.string().nullable().optional(),
          onPlaneEfficiencyPercent: z.string().nullable().optional(),
          attackAngleDeg: z.string().nullable().optional(),
          earlyConnectionDeg: z.string().nullable().optional(),
          connectionAtImpactDeg: z.string().nullable().optional(),
          verticalBatAngleDeg: z.string().nullable().optional(),
          powerKw: z.string().nullable().optional(),
          timeToContactSec: z.string().nullable().optional(),
          peakHandSpeedMph: z.string().nullable().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();

      // Update session fields if provided
      const sessionUpdates: Record<string, any> = {};
      if (input.sessionDate) sessionUpdates.sessionDate = new Date(input.sessionDate);
      if (input.sessionType) sessionUpdates.sessionType = input.sessionType;
      if (Object.keys(sessionUpdates).length > 0) {
        await db.update(blastSessions).set(sessionUpdates).where(eq(blastSessions.id, input.sessionId));
      }

      // Update metrics if provided
      if (input.metrics) {
        const m = input.metrics;
        await db.update(blastMetrics).set({
          planeScore: m.planeScore ?? null,
          connectionScore: m.connectionScore ?? null,
          rotationScore: m.rotationScore ?? null,
          batSpeedMph: m.batSpeedMph ?? null,
          rotationalAccelerationG: m.rotationalAccelerationG ?? null,
          onPlaneEfficiencyPercent: m.onPlaneEfficiencyPercent ?? null,
          attackAngleDeg: m.attackAngleDeg ?? null,
          earlyConnectionDeg: m.earlyConnectionDeg ?? null,
          connectionAtImpactDeg: m.connectionAtImpactDeg ?? null,
          verticalBatAngleDeg: m.verticalBatAngleDeg ?? null,
          powerKw: m.powerKw ?? null,
          timeToContactSec: m.timeToContactSec ?? null,
          peakHandSpeedMph: m.peakHandSpeedMph ?? null,
        }).where(eq(blastMetrics.sessionId, input.sessionId));
      }

      // Also update the linked session note summary if one exists
      if (input.metrics) {
        const [linkedNote] = await db
          .select({ id: sessionNotes.id })
          .from(sessionNotes)
          .where(eq(sessionNotes.blastSessionId, input.sessionId))
          .limit(1);
        if (linkedNote) {
          const m = input.metrics;
          const metricsSummary: string[] = [];
          if (m.batSpeedMph) metricsSummary.push(`Bat Speed: ${m.batSpeedMph} mph`);
          if (m.rotationalAccelerationG) metricsSummary.push(`Rot. Accel: ${m.rotationalAccelerationG} g`);
          if (m.planeScore != null) metricsSummary.push(`Plane: ${m.planeScore}`);
          if (m.connectionScore != null) metricsSummary.push(`Connection: ${m.connectionScore}`);
          if (m.rotationScore != null) metricsSummary.push(`Rotation: ${m.rotationScore}`);
          if (m.powerKw) metricsSummary.push(`Power: ${m.powerKw} kW`);
          if (m.peakHandSpeedMph) metricsSummary.push(`Peak Hand Speed: ${m.peakHandSpeedMph} mph`);
          const metricsText = metricsSummary.length > 0
            ? `Session Blast Metrics: ${metricsSummary.join(", ")}`
            : "Blast session recorded (no metrics entered)";
          await db.update(sessionNotes).set({
            whatImproved: metricsText,
            whatNeedsWork: "",
            sessionLabel: `Blast ${input.sessionType || ""} Session`.trim(),
          }).where(eq(sessionNotes.id, linkedNote.id));
        }
      }

      return { success: true };
    }),

  /** Bulk import sessions from CSV data */
  bulkImportSessions: protectedProcedure
    .input(
      z.object({
        playerId: z.string(),
        createSessionNotes: z.boolean().optional(),
        sessions: z.array(
          z.object({
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
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();

      // Get player info for session note creation
      let playerUserId: number | null = null;
      let playerName = "";
      if (input.createSessionNotes !== false) {
        const [player] = await db
          .select({ userId: blastPlayers.userId, fullName: blastPlayers.fullName })
          .from(blastPlayers)
          .where(eq(blastPlayers.id, input.playerId))
          .limit(1);
        playerUserId = player?.userId ?? null;
        playerName = player?.fullName ?? "";
      }

      let imported = 0;
      let notesCreated = 0;
      const errors: string[] = [];

      for (let i = 0; i < input.sessions.length; i++) {
        const s = input.sessions[i];
        try {
          const sessionId = crypto.randomUUID();
          await db.insert(blastSessions).values({
            id: sessionId,
            playerId: input.playerId,
            sessionDate: new Date(s.sessionDate),
            sessionType: s.sessionType,
          });
          await db.insert(blastMetrics).values({
            sessionId,
            planeScore: s.metrics.planeScore ?? null,
            connectionScore: s.metrics.connectionScore ?? null,
            rotationScore: s.metrics.rotationScore ?? null,
            batSpeedMph: s.metrics.batSpeedMph ?? null,
            rotationalAccelerationG: s.metrics.rotationalAccelerationG ?? null,
            onPlaneEfficiencyPercent: s.metrics.onPlaneEfficiencyPercent ?? null,
            attackAngleDeg: s.metrics.attackAngleDeg ?? null,
            earlyConnectionDeg: s.metrics.earlyConnectionDeg ?? null,
            connectionAtImpactDeg: s.metrics.connectionAtImpactDeg ?? null,
            verticalBatAngleDeg: s.metrics.verticalBatAngleDeg ?? null,
            powerKw: s.metrics.powerKw ?? null,
            timeToContactSec: s.metrics.timeToContactSec ?? null,
            peakHandSpeedMph: s.metrics.peakHandSpeedMph ?? null,
          });
          imported++;

          // Create linked session note if player is linked
          if (input.createSessionNotes !== false && playerUserId) {
            try {
              const sessionNumber = await sessionNotesDb.getNextSessionNumber(playerUserId);
              const m = s.metrics;
              const metricsSummary: string[] = [];
              if (m.batSpeedMph) metricsSummary.push(`Bat Speed: ${m.batSpeedMph} mph`);
              if (m.rotationalAccelerationG) metricsSummary.push(`Rot. Accel: ${m.rotationalAccelerationG} g`);
              if (m.planeScore != null) metricsSummary.push(`Plane: ${m.planeScore}`);
              if (m.connectionScore != null) metricsSummary.push(`Connection: ${m.connectionScore}`);
              if (m.rotationScore != null) metricsSummary.push(`Rotation: ${m.rotationScore}`);
              if (m.powerKw) metricsSummary.push(`Power: ${m.powerKw} kW`);
              const metricsText = metricsSummary.length > 0
                ? `Session Blast Metrics: ${metricsSummary.join(", ")}`
                : "Blast session recorded (no metrics entered)";
              await sessionNotesDb.createSessionNote({
                coachId: ctx.user.id,
                athleteId: playerUserId,
                sessionNumber,
                sessionLabel: `Blast ${s.sessionType} Session`,
                sessionDate: new Date(s.sessionDate),
                duration: null,
                skillsWorked: ["Swing Mechanics"],
                whatImproved: metricsText,
                whatNeedsWork: "",
                homeworkDrills: [],
                overallRating: null,
                privateNotes: null,
                practicePlanId: null,
                blastSessionId: sessionId,
              });
              notesCreated++;
            } catch (noteErr) {
              // Don't fail the whole import if note creation fails
              console.error(`[Blast Import] Failed to create note for session ${i}:`, noteErr);
            }
          }
        } catch (err) {
          errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      return { imported, notesCreated, errors, total: input.sessions.length };
    }),

  /** Get my own Blast data (athlete-facing) */
  getMyBlastData: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();

    // Find the blast player linked to this user
    const [player] = await db
      .select({ id: blastPlayers.id, fullName: blastPlayers.fullName })
      .from(blastPlayers)
      .where(eq(blastPlayers.userId, ctx.user.id))
      .limit(1);

    if (!player) {
      return { player: null, sessions: [], trends: [] };
    }

    // Get all sessions with metrics
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
      .where(eq(blastSessions.playerId, player.id))
      .orderBy(desc(blastSessions.sessionDate));

    return { player, sessions };
  }),

  /** Create session notes retroactively for all unlinked Blast sessions of a player */
  createRetroactiveNotes: protectedProcedure
    .input(z.object({ playerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();

      // Get the player and verify they're linked to a portal user
      const [player] = await db
        .select({ userId: blastPlayers.userId, fullName: blastPlayers.fullName })
        .from(blastPlayers)
        .where(eq(blastPlayers.id, input.playerId))
        .limit(1);

      if (!player) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });
      }
      if (!player.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Player must be linked to a portal account first" });
      }

      // Find all Blast sessions that don't have a linked session note
      const allSessions = await db
        .select({
          sessionId: blastSessions.id,
          sessionDate: blastSessions.sessionDate,
          sessionType: blastSessions.sessionType,
          batSpeedMph: blastMetrics.batSpeedMph,
          rotationalAccelerationG: blastMetrics.rotationalAccelerationG,
          planeScore: blastMetrics.planeScore,
          connectionScore: blastMetrics.connectionScore,
          rotationScore: blastMetrics.rotationScore,
          powerKw: blastMetrics.powerKw,
          peakHandSpeedMph: blastMetrics.peakHandSpeedMph,
          onPlaneEfficiencyPercent: blastMetrics.onPlaneEfficiencyPercent,
          attackAngleDeg: blastMetrics.attackAngleDeg,
          earlyConnectionDeg: blastMetrics.earlyConnectionDeg,
          connectionAtImpactDeg: blastMetrics.connectionAtImpactDeg,
          verticalBatAngleDeg: blastMetrics.verticalBatAngleDeg,
          timeToContactSec: blastMetrics.timeToContactSec,
        })
        .from(blastSessions)
        .leftJoin(blastMetrics, eq(blastMetrics.sessionId, blastSessions.id))
        .where(eq(blastSessions.playerId, input.playerId))
        .orderBy(asc(blastSessions.sessionDate));

      // Get existing linked session note blast IDs
      const existingNotes = await db
        .select({ blastSessionId: sessionNotes.blastSessionId })
        .from(sessionNotes)
        .where(
          and(
            eq(sessionNotes.athleteId, player.userId),
            sql`${sessionNotes.blastSessionId} IS NOT NULL`
          )
        );
      const linkedIds = new Set(existingNotes.map((n) => n.blastSessionId));

      // Filter to unlinked sessions
      const unlinkedSessions = allSessions.filter((s) => !linkedIds.has(s.sessionId));

      let notesCreated = 0;
      const errors: string[] = [];

      for (const s of unlinkedSessions) {
        try {
          const sessionNumber = await sessionNotesDb.getNextSessionNumber(player.userId);
          const metricsSummary: string[] = [];
          if (s.batSpeedMph) metricsSummary.push(`Bat Speed: ${s.batSpeedMph} mph`);
          if (s.rotationalAccelerationG) metricsSummary.push(`Rot. Accel: ${s.rotationalAccelerationG} g`);
          if (s.planeScore != null) metricsSummary.push(`Plane: ${s.planeScore}`);
          if (s.connectionScore != null) metricsSummary.push(`Connection: ${s.connectionScore}`);
          if (s.rotationScore != null) metricsSummary.push(`Rotation: ${s.rotationScore}`);
          if (s.powerKw) metricsSummary.push(`Power: ${s.powerKw} kW`);
          const metricsText = metricsSummary.length > 0
            ? `Session Blast Metrics: ${metricsSummary.join(", ")}`
            : "Blast session recorded (no metrics entered)";

          await sessionNotesDb.createSessionNote({
            coachId: ctx.user.id,
            athleteId: player.userId,
            sessionNumber,
            sessionLabel: `Blast ${s.sessionType || "General"} Session`,
            sessionDate: s.sessionDate ? new Date(s.sessionDate) : new Date(),
            duration: null,
            skillsWorked: ["Swing Mechanics"],
            whatImproved: metricsText,
            whatNeedsWork: "",
            homeworkDrills: [],
            overallRating: null,
            privateNotes: null,
            practicePlanId: null,
            blastSessionId: s.sessionId,
          });
          notesCreated++;
        } catch (err) {
          errors.push(`Session ${s.sessionId}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      return {
        notesCreated,
        errors,
        totalUnlinked: unlinkedSessions.length,
        alreadyLinked: linkedIds.size,
      };
    }),

  /** Delete a session, its metrics, and any linked session note */
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      // Delete any linked session note first
      await db.delete(sessionNotes).where(eq(sessionNotes.blastSessionId, input.sessionId));
      // Delete metrics (child), then session (parent)
      await db.delete(blastMetrics).where(eq(blastMetrics.sessionId, input.sessionId));
      await db.delete(blastSessions).where(eq(blastSessions.id, input.sessionId));
      return { success: true };
    }),
});
