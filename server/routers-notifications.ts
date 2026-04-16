import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { markAllNotificationsRead } from "./notificationEngine";

export const notificationsRouter = router({
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    return await db.getUnreadNotifications(ctx.user.id);
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    return await db.getNotificationsByUser(ctx.user.id);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await db.markNotificationAsRead(input.notificationId);
      return { success };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) return { success: false };
    const success = await markAllNotificationsRead(ctx.user.id);
    return { success };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await db.deleteNotification(input.notificationId);
      return { success };
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return await db.getNotificationPreferences(ctx.user.id);
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.number().optional(),
        drillAssignments: z.number().optional(),
        notesUpdates: z.number().optional(),
        recapUpdates: z.number().optional(),
        swingAnalysis: z.number().optional(),
        featureAnnouncements: z.number().optional(),
        feedbackUpdates: z.number().optional(),
        submissionUpdates: z.number().optional(),
        badgeUpdates: z.number().optional(),
        practicePlanUpdates: z.number().optional(),
        systemUpdates: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) return null;
      return await db.createOrUpdateNotificationPreferences(ctx.user.id, input);
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return 0;
    return await db.getUnreadNotificationCount(ctx.user.id);
  }),
});
