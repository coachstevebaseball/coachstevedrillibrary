import { router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { drills } from "../../drizzle/schema";
import { eq, like, or, and, sql } from "drizzle-orm";

// ─── Shared Zod schema for rich coaching fields ───────────────────────────────
const richFieldsSchema = z.object({
  // Core fields
  name: z.string().min(1).max(255).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  categories: z.array(z.string()).optional(),
  duration: z.string().max(50).optional().nullable(),
  url: z.string().optional().nullable(),
  isDirectLink: z.union([z.boolean(), z.number().transform((n) => n !== 0)]).optional(),
  ageLevel: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  problem: z.array(z.string()).optional().nullable(),
  goal: z.array(z.string()).optional().nullable(),
  drillType: z.string().max(100).optional().nullable(),
  problems: z.array(z.string()).optional().nullable(),
  outcomes: z.array(z.string()).optional().nullable(),
  source: z.string().max(20).optional(),
  // Rich coaching fields
  goalOfDrill: z.string().optional().nullable(),
  whoThisDrillIsBestFor: z.string().optional().nullable(),
  coachingNotes: z.array(z.string()).optional().nullable(),
  whatThisDrillHelpsFix: z.array(z.string()).optional().nullable(),
  howToRunTheDrill: z.array(z.string()).optional().nullable(),
  commonMistakes: z.array(z.string()).optional().nullable(),
  coachSteveCue: z.string().optional().nullable(),
  gameTransferExplanation: z.string().optional().nullable(),
  // Detail-page redesign fields (added 2026-05-12)
  equipment: z.array(z.string()).optional().nullable(),
  repsSets: z.string().max(100).optional().nullable(),
  nextStepDrillIds: z.array(z.string()).optional().nullable(),
  featured: z.boolean().optional(),
});

// ─── Slug generator ───────────────────────────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const drillsAdminRouter = router({
  /**
   * Create a new drill from a full or partial JSON object.
   */
  adminCreate: adminProcedure
    .input(
      richFieldsSchema.extend({
        name: z.string().min(1).max(255),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        categories: z.array(z.string()).default(["Hitting"]),
        drillId: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const drillId = input.drillId || generateSlug(input.name);
      if (!drillId) throw new TRPCError({ code: "BAD_REQUEST", message: "Could not generate a valid drillId." });

      const existing = await db
        .select({ drillId: drills.drillId })
        .from(drills)
        .where(eq(drills.drillId, drillId))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A drill with drillId "${drillId}" already exists. Provide a unique drillId or rename the drill.`,
        });
      }

      await db.insert(drills).values({
        drillId,
        name: input.name,
        difficulty: input.difficulty,
        categories: input.categories ?? ["Hitting"],
        duration: input.duration ?? null,
        url: input.url ?? null,
        isDirectLink: typeof input.isDirectLink === "boolean" ? input.isDirectLink : false,
        ageLevel: input.ageLevel ?? null,
        tags: input.tags ?? null,
        problem: input.problem ?? null,
        goal: input.goal ?? null,
        drillType: input.drillType ?? null,
        problems: input.problems ?? null,
        outcomes: input.outcomes ?? null,
        source: input.source ?? "custom",
        isHidden: false,
        createdBy: ctx.user.id,
        goalOfDrill: input.goalOfDrill ?? null,
        whoThisDrillIsBestFor: input.whoThisDrillIsBestFor ?? null,
        coachingNotes: input.coachingNotes ?? null,
        whatThisDrillHelpsFix: input.whatThisDrillHelpsFix ?? null,
        howToRunTheDrill: input.howToRunTheDrill ?? null,
        commonMistakes: input.commonMistakes ?? null,
        coachSteveCue: input.coachSteveCue ?? null,
        gameTransferExplanation: input.gameTransferExplanation ?? null,
        equipment: input.equipment ?? null,
        repsSets: input.repsSets ?? null,
        nextStepDrillIds: input.nextStepDrillIds ?? null,
        featured: input.featured ?? false,
      });

      return { success: true, drillId };
    }),

  /**
   * Update an existing drill. Only provided fields are updated.
   */
  adminUpdate: adminProcedure
    .input(richFieldsSchema.extend({ drillId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const { drillId, ...fields } = input;

      // Build patch — only keys explicitly provided (not undefined)
      const patch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) patch[key] = value;
      }

      if (Object.keys(patch).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields provided to update." });
      }

      await db.update(drills).set(patch as any).where(eq(drills.drillId, drillId));

      return { success: true, drillId };
    }),

  /**
   * Soft-delete a drill by setting isHidden = true.
   */
  adminDelete: adminProcedure
    .input(z.object({ drillId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      await db.update(drills).set({ isHidden: true }).where(eq(drills.drillId, input.drillId));
      return { success: true };
    }),

  /**
   * Unhide a previously soft-deleted drill.
   */
  adminUnhide: adminProcedure
    .input(z.object({ drillId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      await db.update(drills).set({ isHidden: false }).where(eq(drills.drillId, input.drillId));
      return { success: true };
    }),

  /**
   * List all drills (including hidden) with pagination, search, and source filter.
   */
  adminList: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        search: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const pageSize = 50;
      const offset = (input.page - 1) * pageSize;

      const conditions: ReturnType<typeof eq>[] = [];

      if (input.source === "hidden") {
        conditions.push(eq(drills.isHidden, true));
      } else if (input.source && input.source !== "all") {
        conditions.push(eq(drills.source, input.source) as any);
        conditions.push(eq(drills.isHidden, false));
      }

      if (input.search?.trim()) {
        conditions.push(
          or(
            like(drills.name, `%${input.search.trim()}%`),
            like(drills.drillId, `%${input.search.trim()}%`)
          ) as any
        );
      }

      const whereClause = conditions.length > 0 ? and(...(conditions as any[])) : undefined;

      const [rows, countResult] = await Promise.all([
        db
          .select({
            id: drills.id,
            drillId: drills.drillId,
            name: drills.name,
            difficulty: drills.difficulty,
            drillType: drills.drillType,
            source: drills.source,
            isHidden: drills.isHidden,
            categories: drills.categories,
            createdAt: drills.createdAt,
            goalOfDrill: drills.goalOfDrill,
            whoThisDrillIsBestFor: drills.whoThisDrillIsBestFor,
            coachingNotes: drills.coachingNotes,
            whatThisDrillHelpsFix: drills.whatThisDrillHelpsFix,
            howToRunTheDrill: drills.howToRunTheDrill,
            commonMistakes: drills.commonMistakes,
            coachSteveCue: drills.coachSteveCue,
            gameTransferExplanation: drills.gameTransferExplanation,
            duration: drills.duration,
            url: drills.url,
            isDirectLink: drills.isDirectLink,
            ageLevel: drills.ageLevel,
            tags: drills.tags,
            problem: drills.problem,
            goal: drills.goal,
            problems: drills.problems,
            outcomes: drills.outcomes,
            equipment: drills.equipment,
            repsSets: drills.repsSets,
            nextStepDrillIds: drills.nextStepDrillIds,
            featured: drills.featured,
          })
          .from(drills)
          .where(whereClause)
          .orderBy(drills.createdAt)
          .limit(pageSize)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(drills).where(whereClause),
      ]);

      return {
        drills: rows,
        total: Number(countResult[0]?.count ?? 0),
        page: input.page,
        pageSize,
        totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / pageSize),
      };
    }),

  /**
   * Get a single drill by drillId (for prefilling the edit form).
   */
  adminGet: adminProcedure
    .input(z.object({ drillId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [drill] = await db
        .select()
        .from(drills)
        .where(eq(drills.drillId, input.drillId))
        .limit(1);

      if (!drill) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Drill "${input.drillId}" not found.` });
      }

      return drill;
    }),

  /**
   * Bulk create drills from a JSON array.
   */
  adminBulkCreate: adminProcedure
    .input(
      z.array(
        richFieldsSchema.extend({
          name: z.string().min(1).max(255),
          difficulty: z.enum(["Easy", "Medium", "Hard"]),
          categories: z.array(z.string()).default(["Hitting"]),
          drillId: z.string().max(255).optional(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const results: Array<{ drillId: string; success: boolean; error?: string }> = [];

      for (const item of input) {
        const drillId = item.drillId || generateSlug(item.name);
        try {
          if (!drillId) throw new Error("Could not generate drillId from name.");

          const existing = await db
            .select({ drillId: drills.drillId })
            .from(drills)
            .where(eq(drills.drillId, drillId))
            .limit(1);

          if (existing.length > 0) throw new Error(`drillId "${drillId}" already exists.`);

          await db.insert(drills).values({
            drillId,
            name: item.name,
            difficulty: item.difficulty,
            categories: item.categories ?? ["Hitting"],
            duration: item.duration ?? null,
            url: item.url ?? null,
            isDirectLink: typeof item.isDirectLink === "boolean" ? item.isDirectLink : false,
            ageLevel: item.ageLevel ?? null,
            tags: item.tags ?? null,
            problem: item.problem ?? null,
            goal: item.goal ?? null,
            drillType: item.drillType ?? null,
            problems: item.problems ?? null,
            outcomes: item.outcomes ?? null,
            source: item.source ?? "custom",
            isHidden: false,
            createdBy: ctx.user.id,
            goalOfDrill: item.goalOfDrill ?? null,
            whoThisDrillIsBestFor: item.whoThisDrillIsBestFor ?? null,
            coachingNotes: item.coachingNotes ?? null,
            whatThisDrillHelpsFix: item.whatThisDrillHelpsFix ?? null,
            howToRunTheDrill: item.howToRunTheDrill ?? null,
            commonMistakes: item.commonMistakes ?? null,
            coachSteveCue: item.coachSteveCue ?? null,
            gameTransferExplanation: item.gameTransferExplanation ?? null,
            equipment: item.equipment ?? null,
            repsSets: item.repsSets ?? null,
            nextStepDrillIds: item.nextStepDrillIds ?? null,
            featured: item.featured ?? false,
          });

          results.push({ drillId, success: true });
        } catch (err: any) {
          results.push({ drillId: drillId || "(unknown)", success: false, error: err.message });
        }
      }

      return { results };
    }),
});
