import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { markAllNotificationsRead, sendNotification, sendBulkNotification } from "./notificationEngine";
import { getDb } from "./db";
import { notifications, users } from "../drizzle/schema";
import { eq, and, desc, inArray, or, like } from "drizzle-orm";

export const notificationsRouter = router({
  // ─── Athlete-facing procedures ──────────────────────────────────────────────

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

  // ─── Admin-only procedures ────────────────────────────────────────────────

  /**
   * Get list of athletes for the recipient picker.
   * Returns active athletes with email addresses.
   */
  adminGetAthletes: adminProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      let query = database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActiveClient: users.isActiveClient,
        })
        .from(users)
        .where(
          and(
            eq(users.role, "athlete"),
            eq(users.isActiveClient, 1),
          )
        )
        .orderBy(users.name);

      const results = await query;

      // Filter by search if provided
      if (input?.search) {
        const s = input.search.toLowerCase();
        return results.filter(u =>
          (u.name?.toLowerCase().includes(s)) ||
          (u.email?.toLowerCase().includes(s))
        );
      }

      return results;
    }),

  /**
   * Send a custom notification to specific athlete(s).
   * Creates notification records and sends emails.
   */
  adminCompose: adminProcedure
    .input(z.object({
      recipientIds: z.array(z.number()).min(1, "Select at least one recipient"),
      title: z.string().min(1, "Title is required").max(255),
      message: z.string().min(1, "Message is required"),
      linkUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const results = await sendBulkNotification(input.recipientIds, {
        type: "coach_message",
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl,
        relatedType: "coach_message",
        metadata: { sentBy: "admin", composedAt: Date.now() },
      });

      return results;
    }),

  /**
   * Broadcast a notification to ALL active athletes.
   */
  adminBroadcast: adminProcedure
    .input(z.object({
      title: z.string().min(1, "Title is required").max(255),
      message: z.string().min(1, "Message is required"),
      linkUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) return { total: 0, sent: 0, failed: 0 };

      // Get all active athletes/users with emails
      const activeUsers = await database
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.role, "athlete"),
            eq(users.isActiveClient, 1),
          )
        );

      const userIds = activeUsers.map(u => u.id);
      if (userIds.length === 0) return { total: 0, sent: 0, failed: 0 };

      const results = await sendBulkNotification(userIds, {
        type: "coach_message",
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl,
        relatedType: "coach_message",
        metadata: { sentBy: "admin", broadcast: true, composedAt: Date.now() },
      });

      return results;
    }),

  /**
   * Get sent notification history for admin review.
   * Shows coach_message type notifications with delivery status.
   */
  adminSentHistory: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return { items: [], total: 0 };

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      // Get coach_message notifications grouped by title+createdAt (broadcast batches)
      const items = await database
        .select({
          id: notifications.id,
          userId: notifications.userId,
          recipientEmail: notifications.recipientEmail,
          title: notifications.title,
          message: notifications.message,
          linkUrl: notifications.linkUrl,
          emailStatus: notifications.emailStatus,
          portalStatus: notifications.portalStatus,
          createdAt: notifications.createdAt,
          sentAt: notifications.sentAt,
          failedAt: notifications.failedAt,
          lastError: notifications.lastError,
          metadata: notifications.metadata,
        })
        .from(notifications)
        .where(eq(notifications.type, "coach_message"))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await database
        .select({ id: notifications.id })
        .from(notifications)
        .where(eq(notifications.type, "coach_message"));

      // Enrich with recipient names
      const userIds = [...new Set(items.map(i => i.userId))];
      let userMap: Record<number, string> = {};
      if (userIds.length > 0) {
        const userRows = await database
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, userIds));
        userMap = Object.fromEntries(userRows.map(u => [u.id, u.name || "Unknown"]));
      }

      return {
        items: items.map(i => ({
          ...i,
          recipientName: userMap[i.userId] || "Unknown",
        })),
        total: countResult.length,
      };
    }),
});
