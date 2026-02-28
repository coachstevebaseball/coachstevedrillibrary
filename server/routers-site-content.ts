import { router, publicProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as siteContentDb from "./siteContent";

export const siteContentRouter = router({
  /**
   * Get all site content overrides (public — needed for rendering).
   */
  getAll: publicProcedure.query(async () => {
    return siteContentDb.getAllSiteContent();
  }),

  /**
   * Update a single content key (admin only).
   */
  update: adminProcedure
    .input(z.object({
      contentKey: z.string().min(1).max(500),
      value: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      await siteContentDb.upsertSiteContent(input.contentKey, input.value, ctx.user.id);
      return { success: true };
    }),

  /**
   * Bulk update multiple content keys (admin only).
   */
  bulkUpdate: adminProcedure
    .input(z.object({
      entries: z.array(z.object({
        contentKey: z.string().min(1).max(500),
        value: z.string(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      await siteContentDb.bulkUpsertSiteContent(input.entries, ctx.user.id);
      return { success: true };
    }),
});
