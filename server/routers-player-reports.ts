import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { playerReports, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

export const playerReportsRouter = router({
  /** Create a new player report (draft by default) */
  create: protectedProcedure
    .input(
      z.object({
        athleteId: z.number(),
        title: z.string().min(1).max(500),
        bodyHtml: z.string().optional(),
        publishNow: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const db = await requireDb();
      const now = new Date();
      const [result] = await db.insert(playerReports).values({
        athleteId: input.athleteId,
        coachId: ctx.user.id,
        title: input.title,
        bodyHtml: input.bodyHtml ?? null,
        isSharedWithAthlete: input.publishNow,
        publishedAt: input.publishNow ? now : null,
      });
      const id = (result as any).insertId as number;
      const [report] = await db.select().from(playerReports).where(eq(playerReports.id, id)).limit(1);
      return report;
    }),

  /** Update title and/or body of an existing report */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        bodyHtml: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const db = await requireDb();
      const [existing] = await db
        .select({ coachId: playerReports.coachId })
        .from(playerReports)
        .where(eq(playerReports.id, input.id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (existing.coachId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own reports" });
      }
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.bodyHtml !== undefined) patch.bodyHtml = input.bodyHtml;
      await db.update(playerReports).set(patch).where(eq(playerReports.id, input.id));
      const [updated] = await db.select().from(playerReports).where(eq(playerReports.id, input.id)).limit(1);
      return updated;
    }),

  /** Publish a report — makes it visible to the athlete */
  publish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const db = await requireDb();
      const [existing] = await db
        .select({ coachId: playerReports.coachId, publishedAt: playerReports.publishedAt })
        .from(playerReports)
        .where(eq(playerReports.id, input.id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (existing.coachId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only publish your own reports" });
      }
      const now = new Date();
      await db.update(playerReports).set({
        isSharedWithAthlete: true,
        publishedAt: existing.publishedAt ?? now,
      }).where(eq(playerReports.id, input.id));
      const [updated] = await db.select().from(playerReports).where(eq(playerReports.id, input.id)).limit(1);
      return updated;
    }),

  /** Unpublish a report — hides it from the athlete */
  unpublish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const db = await requireDb();
      const [existing] = await db
        .select({ coachId: playerReports.coachId })
        .from(playerReports)
        .where(eq(playerReports.id, input.id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (existing.coachId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only unpublish your own reports" });
      }
      await db.update(playerReports).set({ isSharedWithAthlete: false }).where(eq(playerReports.id, input.id));
      const [updated] = await db.select().from(playerReports).where(eq(playerReports.id, input.id)).limit(1);
      return updated;
    }),

  /** Delete a report permanently */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const db = await requireDb();
      const [existing] = await db
        .select({ coachId: playerReports.coachId })
        .from(playerReports)
        .where(eq(playerReports.id, input.id))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (existing.coachId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own reports" });
      }
      await db.delete(playerReports).where(eq(playerReports.id, input.id));
      return { success: true };
    }),

  /** List all reports authored by the current coach, optionally filtered by athlete */
  listByCoach: protectedProcedure
    .input(z.object({ athleteId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const db = await requireDb();
      const conditions = [eq(playerReports.coachId, ctx.user.id)];
      if (input.athleteId) conditions.push(eq(playerReports.athleteId, input.athleteId));
      const reports = await db
        .select({
          id: playerReports.id,
          athleteId: playerReports.athleteId,
          coachId: playerReports.coachId,
          title: playerReports.title,
          bodyHtml: playerReports.bodyHtml,
          isSharedWithAthlete: playerReports.isSharedWithAthlete,
          publishedAt: playerReports.publishedAt,
          createdAt: playerReports.createdAt,
          updatedAt: playerReports.updatedAt,
          athleteName: users.name,
          athleteEmail: users.email,
        })
        .from(playerReports)
        .leftJoin(users, eq(users.id, playerReports.athleteId))
        .where(and(...conditions))
        .orderBy(desc(playerReports.updatedAt));
      return reports;
    }),

  /** Get reports shared with the current athlete (athlete-facing) */
  listMyReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const reports = await db
      .select({
        id: playerReports.id,
        title: playerReports.title,
        bodyHtml: playerReports.bodyHtml,
        publishedAt: playerReports.publishedAt,
        createdAt: playerReports.createdAt,
        updatedAt: playerReports.updatedAt,
      })
      .from(playerReports)
      .where(
        and(
          eq(playerReports.athleteId, ctx.user.id),
          eq(playerReports.isSharedWithAthlete, true)
        )
      )
      .orderBy(desc(playerReports.publishedAt));
    return reports;
  }),

  /** Delete all reports for an athlete (used when deleting an athlete account) */
  deleteAllForAthlete: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await requireDb();
      await db.delete(playerReports).where(eq(playerReports.athleteId, input.athleteId));
      return { success: true };
    }),
});
