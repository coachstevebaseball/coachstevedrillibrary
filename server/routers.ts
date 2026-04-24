import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import * as drillAssignmentDb from "./drillAssignments";
import * as drillPageLayoutDb from "./drillPageLayouts";
import * as drillPageTemplateDb from "./drillPageTemplates";
import * as inviteDb from "./invites";
import { drillGeneratorRouter } from "./routers-drill-generator";
import { submissionsRouter } from "./routers-submissions";
import { videoUploadRouter } from "./routers-video-upload";
import { notificationsRouter } from "./routers-notifications";
import { qaRouter } from "./routers-qa";
import { imageUploadRouter } from "./routers-image-upload";
import { activityRouter } from "./routers-activity";
import { favoritesRouter } from "./routers-favorites";
import { practicePlansRouter } from "./routers-practice-plans";
import { sessionNotesRouter } from "./routers-session-notes";
import { progressReportsRouter } from "./routers-progress-reports";
import { athleteProfilesRouter } from "./routers-athlete-profiles";
import { videoAnalysisRouter } from "./routers-video-analysis";
import { blastMetricsRouter } from "./routers-blast-metrics";
import { badgesRouter } from "./routers-badges";
import { siteContentRouter } from "./routers-site-content";
import { hittingCoachRouter } from "./routers-hitting-coach";
import { drillsAdminRouter } from "./routers/drillsAdmin";
import * as drillCustomizationsDb from "./drillCustomizations";
import { storagePut } from "./storage";
import { checkAndSendMilestoneEmail } from "./notificationService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  siteContent: siteContentRouter,
  hittingCoach: hittingCoachRouter,
  drillsAdmin: drillsAdminRouter,
  notifications: notificationsRouter,
  imageUpload: imageUploadRouter,
  activity: activityRouter,
  favorites: favoritesRouter,
  practicePlans: practicePlansRouter,
  sessionNotes: sessionNotesRouter,
  progressReports: progressReportsRouter,
  athleteProfiles: athleteProfilesRouter,
  badges: badgesRouter,
  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      // Fetch full user record from database to include role
      const fullUser = await db.getUserByOpenId(opts.ctx.user.openId);
      return fullUser || opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Admin router for managing client access
  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await db.getAllUsers();
    }),
    toggleClientAccess: protectedProcedure
      .input(z.object({ userId: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const success = await db.toggleClientAccess(input.userId, input.isActive);
        
        // Auto-send welcome email when activating a user
        if (success && input.isActive) {
          const user = await db.getUserById(input.userId);
          if (user && user.email && !user.sentWelcomeEmail) {
            const { sendWelcomeEmail: sendEmail } = await import('./email');
            const emailResult = await sendEmail({
              athleteEmail: user.email,
              athleteName: user.name || 'Athlete',
              portalUrl: `${ENV.appUrl}/athlete-portal`,
            });
            if (emailResult.success) {
              await db.markWelcomeEmailSent(input.userId);
            }
          }
        }
        
        return { success };
      }),
    convertToAthlete: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.convertUserToAthlete(input.userId);
        return { success: true };
      }),
    updateUserRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.updateUserRole(input.userId, input.role as any);
        return { success: true };
      }),
    sendWelcomeEmail: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }
        if (!user.email) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User email not found' });
        }
        const { sendWelcomeEmail: sendEmail } = await import('./email');
        const result = await sendEmail({
          athleteEmail: user.email,
          athleteName: user.name || 'Athlete',
          portalUrl: `${ENV.appUrl}/athlete-portal`,
        });
        if (result.success) {
          await db.markWelcomeEmailSent(input.userId);
        }
        return result;
      }),
    bulkImportDescriptions: protectedProcedure
      .input(z.object({ drillsData: z.array(z.object({ drillName: z.string(), description: z.string() })) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await db.bulkImportDrillDescriptions(input.drillsData);
      }),
    bulkImportGoals: protectedProcedure
      .input(z.object({ goalsData: z.array(z.object({ drillName: z.string(), goal: z.string() })) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await db.bulkImportDrillGoals(input.goalsData);
      }),
    triggerStreakReminders: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const { runStreakReminderJob } = await import('./streakReminderJob');
        await runStreakReminderJob();
        return { success: true };
      }),

    // ── Email diagnostics ────────────────────────────────────────
    testEmailDelivery: protectedProcedure
      .input(z.object({ toEmail: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const hasKey = !!ENV.resendApiKey;
        const fromEmail = ENV.resendFromEmail;
        const appUrl = ENV.appUrl;

        if (!hasKey) {
          return {
            success: false,
            error: 'RESEND_API_KEY is not set in environment variables',
            hasKey: false,
            fromEmail,
            appUrl,
          };
        }

        try {
          const { getResend } = await import('./email');
          const resend = getResend();
          const result = await resend.emails.send({
            from: fromEmail,
            to: input.toEmail,
            subject: '✅ Coach Steve App — Email Test',
            html: `<h2>Email delivery is working!</h2>
                   <p>This is a test from the Coach Steve Baseball platform.</p>
                   <p><strong>From:</strong> ${fromEmail}</p>
                   <p><strong>Portal URL:</strong> ${appUrl}</p>
                   <p><em>If you received this, email notifications are configured correctly.</em></p>`,
          });

          if (result.error) {
            return { success: false, error: result.error.message, hasKey: true, fromEmail, appUrl };
          }
          return { success: true, messageId: result.data?.id, hasKey: true, fromEmail, appUrl };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            hasKey: true,
            fromEmail,
            appUrl,
          };
        }
      }),

    getEmailStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return {
          hasResendKey: !!ENV.resendApiKey,
          fromEmail: ENV.resendFromEmail,
          appUrl: ENV.appUrl,
          hasGeminiKey: !!ENV.geminiApiKey,
          hasForgeKey: !!ENV.forgeApiKey,
        };
      }),

    // ── Activity Feed ────────────────────────────────────────────
    getActivityFeed: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
        types: z.array(z.string()).optional(), // filter by event types
      }))
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const database = await db.getDb();
        if (!database) return { events: [], total: 0 };

        const { coachActivityLog, emailNotificationLog } = await import('../drizzle/schema');
        const { desc, or } = await import('drizzle-orm');

        // Fetch coach activity log
        const activityEvents = await database
          .select()
          .from(coachActivityLog)
          .orderBy(desc(coachActivityLog.createdAt))
          .limit(30);

        // Fetch email notification log
        const emailEvents = await database
          .select()
          .from(emailNotificationLog)
          .orderBy(desc(emailNotificationLog.createdAt))
          .limit(30);

        // Merge and sort by date
        const merged = [
          ...activityEvents.map((e: any) => ({
            id: `activity-${e.id}`,
            source: 'activity' as const,
            eventType: e.eventType,
            title: e.title,
            message: e.message,
            athleteId: e.athleteId,
            athleteName: e.athleteName,
            severity: e.severity,
            isRead: e.isRead,
            metadata: e.metadata,
            createdAt: e.createdAt,
          })),
          ...emailEvents.map((e: any) => ({
            id: `email-${e.id}`,
            source: 'email' as const,
            eventType: e.emailType,
            title: e.subject,
            message: e.description || e.subject,
            athleteId: e.recipientId,
            athleteName: e.recipientName,
            severity: e.success ? 'info' : 'warning',
            isRead: 1,
            metadata: e.metadata,
            createdAt: e.createdAt,
          })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { events: merged.slice(0, 50), total: merged.length };
      }),

    markActivityRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const database = await db.getDb();
        if (!database) return { success: false };
        const { coachActivityLog } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await database.update(coachActivityLog)
          .set({ isRead: 1 })
          .where(eq(coachActivityLog.id, input.id));
        return { success: true };
      }),

    // ── Duplicate athlete detection ─────────────────────────────
    findDuplicateAthletes: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const allUsers = await db.getAllUsers();
        // Group by normalised email (lowercase, trimmed)
        const byEmail = new Map<string, typeof allUsers>();
        for (const u of allUsers) {
          if (!u.email) continue;
          const key = u.email.toLowerCase().trim();
          if (!byEmail.has(key)) byEmail.set(key, []);
          byEmail.get(key)!.push(u);
        }
        // Also group by normalised name (case-insensitive)
        const byName = new Map<string, typeof allUsers>();
        for (const u of allUsers) {
          if (!u.name) continue;
          const key = u.name.toLowerCase().trim();
          if (!byName.has(key)) byName.set(key, []);
          byName.get(key)!.push(u);
        }
        const groups: {
          reason: string;
          key: string;
          users: { id: number; name: string | null; email: string | null; createdAt: Date | null }[];
        }[] = [];
        for (const [email, users] of Array.from(byEmail.entries())) {
          if (users.length > 1) {
            groups.push({ reason: 'Same email', key: email, users });
          }
        }
        for (const [name, users] of Array.from(byName.entries())) {
          if (users.length > 1) {
            // Avoid double-reporting if already caught by email
            const alreadyReported = groups.some(g =>
              g.users.some(u => users.find((u2: { id: number }) => u2.id === u.id))
            );
            if (!alreadyReported) {
              groups.push({ reason: 'Same name', key: name, users });
            }
          }
        }
        return groups;
      }),

    fixBrokenIds: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No database connection' });

        const { sql } = await import('drizzle-orm');

        // Old ID -> New ID mappings (IDs changed manually by coach)
        const idMappings = [
          { oldId: 3780043, newId: 4,        name: 'Gavin Goldstein' },
          { oldId: 3840001, newId: 8,        name: 'Gunnar Nelson' },
          { oldId: 3570024, newId: 10110004, name: 'Sean Jaeger' },
          { oldId: 3690071, newId: 3,        name: 'Emmet Reilly' },
          { oldId: 3420019, newId: 3,        name: 'Ellyn Reilly' },
          { oldId: 9540332, newId: 101400188, name: 'Caputo family' },
        ];

        const results: string[] = [];

        for (const mapping of idMappings) {
          // Fix drillAssignments
          const assignResult = await database.execute(
            sql`UPDATE drillAssignments SET userId = ${mapping.newId} WHERE userId = ${mapping.oldId}`
          );
          // Fix athleteActivity
          const actResult = await database.execute(
            sql`UPDATE athleteActivity SET athleteId = ${mapping.newId} WHERE athleteId = ${mapping.oldId}`
          );
          results.push(`${mapping.name}: fixed assignments + activity`);
        }

        // Fix display names in athleteActivity
        await database.execute(sql`UPDATE athleteActivity SET athleteName = 'Gavin Goldstein' WHERE athleteId = 4`);
        await database.execute(sql`UPDATE athleteActivity SET athleteName = 'Gunnar Nelson' WHERE athleteId = 8`);
        await database.execute(sql`UPDATE athleteActivity SET athleteName = 'Sean Jaeger' WHERE athleteId = 10110004`);
        await database.execute(sql`UPDATE athleteActivity SET athleteName = 'Emmet Reilly' WHERE athleteId = 3`);

        // Count remaining broken assignments
        const broken = await database.execute(
          sql`SELECT COUNT(*) as count FROM drillAssignments WHERE userId IS NULL OR userId = ''`
        );

        return {
          success: true,
          fixed: results,
          remainingBroken: (broken as any)[0]?.[0]?.count ?? 'unknown',
        };
      }),

    markAllActivityRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const database = await db.getDb();
        if (!database) return { success: false };
        const { coachActivityLog } = await import('../drizzle/schema');
        await database.update(coachActivityLog).set({ isRead: 1 });
        return { success: true };
      }),

    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete your own account' });
        }
        const success = await db.deleteUser(input.userId);
        return { success };
      }),

    updateUserInfo: protectedProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        if (input.name !== undefined) {
          await db.updateUserName(input.userId, input.name);
        }
        if (input.email !== undefined) {
          await db.updateUserEmail(input.userId, input.email);
        }
        return { success: true };
      }),
  }),

  // Drill assignment router for coach dashboard
  drillAssignments: router({
    assignDrill: protectedProcedure
      .input(z.object({
        userId: z.number().nullable().optional(),
        inviteId: z.number().optional(),
        drillId: z.string(),
        drillName: z.string(),
        notes: z.string().optional(),
        difficulty: z.string().optional(),
        duration: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        // Must have either userId or inviteId
        if (!input.userId && !input.inviteId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Must provide either userId or inviteId' });
        }
        await drillAssignmentDb.assignDrill(
          input.userId || null,
          input.drillId,
          input.drillName,
          input.notes,
          ctx.user.name || 'Coach',
          { difficulty: input.difficulty || 'Unknown', duration: input.duration || 'Unknown' },
          input.inviteId
        );
        return { success: true };
      }),
    
    unassignDrill: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await drillAssignmentDb.unassignDrill(input.assignmentId);
        return { success: true };
      }),

    sendFollowUpReminder: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        // Get athlete info
        const athlete = await db.getUserById(input.userId);
        if (!athlete) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Athlete not found' });
        }
        // Get incomplete assignments for this athlete
        const assignments = await drillAssignmentDb.getUserAssignments(input.userId);
        const incompleteDrills = assignments.filter((a: any) => a.status !== 'completed');
        if (incompleteDrills.length === 0) {
          return { success: false, message: 'No incomplete drills to remind about' };
        }
        const { sendDrillFollowUpReminder } = await import('./email');
        const result = await sendDrillFollowUpReminder({
          athleteEmail: athlete.email || '',
          athleteName: athlete.name || 'Athlete',
          drills: incompleteDrills.map((d: any) => ({
            name: d.drillName || d.drill_name || 'Drill',
            assignedDate: new Date(d.assignedAt || d.assigned_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: d.status || 'assigned',
          })),
          coachName: ctx.user.name || 'Coach',
          portalUrl: `${ENV.appUrl}/athlete-portal`,
        });
        return { success: result.success, error: result.error };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({ assignmentId: z.number(), status: z.enum(["assigned", "in-progress", "completed"]), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        // Allow admins to update any assignment
        if (ctx.user.role === 'admin') {
          await drillAssignmentDb.updateAssignmentStatus(input.assignmentId, input.status, input.notes);
          // Check milestone on drill completion (Use Case E)
          if (input.status === "completed") {
            const assignment = await drillAssignmentDb.getAssignmentById(input.assignmentId);
            if (assignment?.userId) {
              checkAndSendMilestoneEmail(assignment.userId).catch(console.error);
            }
          }
          return { success: true };
        }
        
        // Allow athletes to update their own assignments
        const assignment = await drillAssignmentDb.getAssignmentById(input.assignmentId);
        if (!assignment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignment not found' });
        }
        if (assignment.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only update your own assignments' });
        }
        
        await drillAssignmentDb.updateAssignmentStatus(input.assignmentId, input.status, input.notes);
        // Check milestone on drill completion (Use Case E)
        if (input.status === "completed" && assignment.userId) {
          checkAndSendMilestoneEmail(assignment.userId).catch(console.error);
        }
        return { success: true };
      }),

    getAssignedDrills: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'athlete') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Athlete access required' });
      }
      return await drillAssignmentDb.getUserAssignments(ctx.user.id);
    }),

    getAllAssignments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await drillAssignmentDb.getAllAssignments();
    }),

    getAthleteAssignmentOverview: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await drillAssignmentDb.getAthleteAssignmentOverview();
    }),

    getUserAssignments: protectedProcedure.query(async ({ ctx }) => {
      return await drillAssignmentDb.getUserAssignments(ctx.user.id);
    }),

    // Admin: get assignments for any user (for "view as athlete" feature)
    getAssignmentsForUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.getUserAssignments(input.userId);
      }),

    getStreak: protectedProcedure.query(async ({ ctx }) => {
      return await drillAssignmentDb.calculateStreak(ctx.user.id);
    }),

    getAthleteProgress: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.getAthleteProgressStats(input.userId);
      }),

    // Coach notes for athlete progress tracking
    getCoachNotes: protectedProcedure
      .input(z.object({ athleteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.getCoachNotes(input.athleteId);
      }),

    addCoachNote: protectedProcedure
      .input(z.object({
        athleteId: z.number(),
        note: z.string(),
        meetingDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.addCoachNote({
          athleteId: input.athleteId,
          coachId: ctx.user.id,
          note: input.note,
          meetingDate: input.meetingDate,
        });
      }),

    updateCoachNote: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        note: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.updateCoachNote(input.noteId, input.note);
      }),

    deleteCoachNote: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.deleteCoachNote(input.noteId);
      }),

    // Weekly goals for athlete drill targets
    getWeeklyGoals: protectedProcedure
      .input(z.object({ athleteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.getWeeklyGoals(input.athleteId);
      }),

    getCurrentWeekGoal: protectedProcedure
      .input(z.object({ athleteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.getCurrentWeekGoal(input.athleteId);
      }),

    createWeeklyGoal: protectedProcedure
      .input(z.object({
        athleteId: z.number(),
        weekStartDate: z.date(),
        weekEndDate: z.date(),
        targetDrillCount: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.createWeeklyGoal({
          athleteId: input.athleteId,
          coachId: ctx.user.id,
          weekStartDate: input.weekStartDate,
          weekEndDate: input.weekEndDate,
          targetDrillCount: input.targetDrillCount,
          notes: input.notes,
        });
      }),

    updateWeeklyGoal: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        targetDrillCount: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.updateWeeklyGoal(input.goalId, {
          targetDrillCount: input.targetDrillCount,
          notes: input.notes,
        });
      }),

    deleteWeeklyGoal: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillAssignmentDb.deleteWeeklyGoal(input.goalId);
      }),
  }),

  // Submissions router
  submissions: submissionsRouter,

  // Video upload router
  videoUpload: videoUploadRouter,

  // AI Video Analysis router
  videoAnalysis: videoAnalysisRouter,
  blastMetrics: blastMetricsRouter,

  // Q&A router
  qa: qaRouter,

  // Drill generator router
  drillGenerator: drillGeneratorRouter,

  // Drill details router
  drillDetails: router({
    getDrillDetail: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        return await db.getDrillDetail(input.drillId);
      }),
    saveDrillInstructions: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        skillSet: z.string().optional(),
        difficulty: z.string().optional(),
        athletes: z.string().optional(),
        time: z.string().optional(),
        equipment: z.string().optional(),
        goal: z.string().optional(),
        description: z.array(z.string()).optional(),
        commonMistakes: z.array(z.string()).optional(),
        progressions: z.array(z.string()).optional(),
        instructions: z.string().optional(),
        // Metadata fields
        drillType: z.string().optional(),
        ageLevel: z.array(z.string()).optional(),
        focusTags: z.array(z.string()).optional(),
        problemsFix: z.array(z.string()).optional(),
        pillars: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.saveDrillDetail(input.drillId, input as any, ctx.user.id);
        return { success: true };
      }),
    // Update tags/metadata for an existing drill
    updateDrillMetadata: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        drillType: z.string().optional(),
        ageLevel: z.array(z.string()).optional(),
        focusTags: z.array(z.string()).optional(),
        problemsFix: z.array(z.string()).optional(),
        pillars: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        // Only update the metadata fields — preserve existing content
        const existing = await db.getDrillDetail(input.drillId);
        await db.saveDrillDetail(input.drillId, {
          drillType: input.drillType,
          ageLevel: input.ageLevel,
          focusTags: input.focusTags,
          problemsFix: input.problemsFix,
          pillars: input.pillars,
          // Preserve existing content fields if record exists
          skillSet: (existing as any)?.skillSet || 'Custom',
          difficulty: (existing as any)?.difficulty || 'Medium',
          athletes: (existing as any)?.athletes || '',
          time: (existing as any)?.time || '',
          equipment: (existing as any)?.equipment || '',
          goal: (existing as any)?.goal || '',
          description: (existing as any)?.description || [],
        }, ctx.user.id);
        return { success: true };
      }),

    bulkUpdateGoals: protectedProcedure
      .input(z.object({ goals: z.record(z.string(), z.string()) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const results: Array<{ drillName: string; success: boolean; error?: string }> = [];
        for (const [drillName, goal] of Object.entries(input.goals)) {
          try {
            await db.updateDrillGoal(drillName, goal as string);
            results.push({ drillName, success: true });
          } catch (error) {
            results.push({ drillName, success: false, error: String(error) });
          }
        }
        return { results };
      }),
    bulkUpdateInstructions: protectedProcedure
      .input(z.object({ instructions: z.record(z.string(), z.string()) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const results: Array<{ drillName: string; success: boolean; error?: string }> = [];
        for (const [drillName, instruction] of Object.entries(input.instructions)) {
          try {
            await db.updateDrillInstructions(drillName, instruction as string);
            results.push({ drillName, success: true });
          } catch (error) {
            results.push({ drillName, success: false, error: String(error) });
          }
        }
        return { results };
      }),
    createNewDrill: protectedProcedure
      .input(z.object({
        name: z.string(),
        difficulty: z.string(),
        category: z.string(),
        duration: z.string(),
        goal: z.string().optional(),
        instructions: z.string().optional(),
        videoUrl: z.string().optional(),
        drillType: z.string().optional(),
        ageLevel: z.array(z.string()).optional(),
        focusTags: z.array(z.string()).optional(),
        problemsFix: z.array(z.string()).optional(),
        pillars: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const result = await db.createNewDrill(input, ctx.user.id);
        return result;
      }),
    getCustomDrills: publicProcedure
      .query(async () => {
        return await db.getCustomDrills();
      }),
    getAllDrillDetails: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await db.getAllDrillDetails();
      }),
    updateDrillContent: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        goal: z.string().optional(),
        instructions: z.string().optional(),
        equipment: z.string().optional(),
        description: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const existing = await db.getDrillDetail(input.drillId);
        await db.saveDrillDetail(input.drillId, {
          skillSet: (existing as any)?.skillSet || 'Hitting',
          difficulty: (existing as any)?.difficulty || 'Medium',
          athletes: (existing as any)?.athletes || '',
          time: (existing as any)?.time || '',
          equipment: input.equipment ?? (existing as any)?.equipment ?? '',
          goal: input.goal ?? (existing as any)?.goal ?? '',
          description: input.description ?? (existing as any)?.description ?? [],
          instructions: input.instructions ?? (existing as any)?.instructions ?? '',
          drillType: (existing as any)?.drillType,
          ageLevel: (existing as any)?.ageLevel,
          focusTags: (existing as any)?.focusTags,
          problemsFix: (existing as any)?.problemsFix,
          pillars: (existing as any)?.pillars,
        }, ctx.user.id);
        return { success: true };
      }),
    // Drill page layout procedures
    savePageLayout: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        blocks: z.array(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillPageLayoutDb.saveDrillPageLayout(input.drillId, input.blocks, ctx.user.id);
      }),
    getPageLayout: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        return await drillPageLayoutDb.getDrillPageLayout(input.drillId);
      }),
    // Drill page template procedures
    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        blocks: z.array(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        return await drillPageTemplateDb.createTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    getTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        return await drillPageTemplateDb.getTemplates(ctx.user.id);
      }),
    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        return await drillPageTemplateDb.deleteTemplate(input.id, ctx.user.id);
      }),
    deletePageLayout: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillPageLayoutDb.deleteDrillPageLayout(input.drillId);
      }),
  }),

  // Videos router
  videos: router({
    getVideo: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        return await db.getDrillVideo(input.drillId);
      }),
    saveVideo: protectedProcedure
      .input(z.object({ drillId: z.string(), videoUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.saveOrUpdateDrillVideo(input.drillId, input.videoUrl, ctx.user.id);
        return { success: true };
      }),
    getAllVideos: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await db.getAllDrillVideos();
    }),
    deleteVideo: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.deleteDrillVideo(input.drillId);
        return { success: true };
      }),
  }),

  // Invite management router
  invites: router({
    createInvite: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await inviteDb.createInvite(input.email, ctx.user.id);
      }),
    
    getAllInvites: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await inviteDb.getAllInvites();
    }),
    
    getInviteByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await inviteDb.getInviteByToken(input.token);
        if (!invite) {
          return { valid: false, email: null, expiresAt: null };
        }
        return { valid: inviteDb.isInviteValid(invite), ...invite };
      }),
    
    acceptInvite: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await inviteDb.acceptInvite(input.token, ctx.user.id);
      }),
    
    resendInvite: protectedProcedure
      .input(z.object({ inviteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await inviteDb.resendInvite(input.inviteId);
      }),
    
    revokeInvite: protectedProcedure
      .input(z.object({ inviteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await inviteDb.revokeInvite(input.inviteId);
        return { success: true };
      }),
    
    deleteInvite: protectedProcedure
      .input(z.object({ inviteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await inviteDb.deleteInvite(input.inviteId);
        return { success: true };
      }),
    
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const user = await inviteDb.verifyEmailWithToken(input.token);
          return { success: true, userId: user.id };
        } catch (error) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Email verification failed' });
        }
      }),
    
    sendExpirationReminders: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const expiringInvites = await inviteDb.getExpiringInvites();
        let sent = 0;
        for (const invite of expiringInvites) {
          try {
            await inviteDb.sendExpirationReminder(invite.id);
            sent++;
          } catch (error) {
            console.error('Error sending expiration reminder:', error);
          }
        }
        return { success: true, remindersSent: sent };
      }),
  }),

  // Drill Customizations router (for editing drill cards)
  drillCustomizations: router({
    // Get customization for a single drill
    get: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        return await drillCustomizationsDb.getDrillCustomization(input.drillId);
      }),

    // Get all customizations (for bulk loading on homepage)
    getAll: publicProcedure.query(async () => {
      return await drillCustomizationsDb.getAllDrillCustomizations();
    }),

    // Save/update drill customization
    save: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        thumbnailUrl: z.string().nullable().optional(),
        briefDescription: z.string().nullable().optional(),
        difficulty: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillCustomizationsDb.upsertDrillCustomization(
          input.drillId,
          {
            thumbnailUrl: input.thumbnailUrl,
            briefDescription: input.briefDescription,
            difficulty: input.difficulty,
            category: input.category,
          },
          ctx.user.id
        );
      }),

    // Upload thumbnail image
    uploadThumbnail: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        imageBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        
        console.log('[Upload] Starting thumbnail upload for drill:', input.drillId);
        console.log('[Upload] Image size (base64 chars):', input.imageBase64.length);
        console.log('[Upload] MIME type:', input.mimeType);
        
        try {
          // Store the base64 image in imageBase64 field (longtext)
          // Don't store data URL in thumbnailUrl (text field has 65535 byte limit)
          const dataUrl = `data:${input.mimeType};base64,${input.imageBase64}`;
          
          console.log('[Upload] Data URL length:', dataUrl.length);
          
          await drillCustomizationsDb.upsertDrillCustomization(
            input.drillId,
            { 
              thumbnailUrl: null, // Don't use this field for data URLs - it has size limit
              imageBase64: input.imageBase64,
              imageMimeType: input.mimeType,
            },
            ctx.user.id
          );
          
          console.log('[Upload] Successfully saved to database');
          return { url: dataUrl };
        } catch (error) {
          console.error('[Upload] Error saving to database:', error);
          throw error;
        }
      }),

    // Delete customization
    delete: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        return await drillCustomizationsDb.deleteDrillCustomization(input.drillId);
      }),
  }),

  // Parent Management router
  parentManagement: router({
    // Link a child account to parent
    linkChild: protectedProcedure
      .input(z.object({ childUserId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.linkChildToParent(input.childUserId, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to link child account' });
        }
        return { success: true };
      }),

    // Get all children managed by current user
    getMyChildren: protectedProcedure.query(async ({ ctx }) => {
      return await db.getChildrenByParent(ctx.user.id);
    }),

    // Get drill assignments for a child (parent can view)
    getChildAssignments: protectedProcedure
      .input(z.object({ childUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify parent-child relationship
        const isParent = await db.isParentOf(ctx.user.id, input.childUserId);
        if (!isParent) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to view this child\'s assignments' });
        }
        return await drillAssignmentDb.getUserAssignments(input.childUserId);
      }),

    // Mark drill complete on behalf of child
    markChildDrillComplete: protectedProcedure
      .input(z.object({ 
        childUserId: z.number(),
        assignmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify parent-child relationship
        const isParent = await db.isParentOf(ctx.user.id, input.childUserId);
        if (!isParent) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to manage this child\'s drills' });
        }
        
        // Mark assignment as completed
        const success = await drillAssignmentDb.updateAssignmentStatus(input.assignmentId, 'completed');
        if (!success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to mark drill complete' });
        }
        return { success: true };
      }),

    // Update drill status on behalf of child
    updateChildDrillStatus: protectedProcedure
      .input(z.object({ 
        childUserId: z.number(),
        assignmentId: z.number(),
        status: z.enum(['assigned', 'in-progress', 'completed']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify parent-child relationship
        const isParent = await db.isParentOf(ctx.user.id, input.childUserId);
        if (!isParent) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to manage this child\'s drills' });
        }
        
        const success = await drillAssignmentDb.updateAssignmentStatus(input.assignmentId, input.status);
        if (!success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update drill status' });
        }
        return { success: true };
      }),

    // Get child's progress data (for parent view)
    getChildProgress: protectedProcedure
      .input(z.object({ childUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify parent-child relationship
        const isParent = await db.isParentOf(ctx.user.id, input.childUserId);
        if (!isParent) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to view this child\'s progress' });
        }
        return await drillAssignmentDb.getAthleteProgressStats(input.childUserId);
      }),
  }),

  // ── Unified Drills Directory ──────────────────────────────────────────────
  drillsDirectory: router({
    /** List all visible drills (public) */
    list: publicProcedure.query(async () => {
      return await db.getAllDrills();
    }),

    /** Get a single drill by slug (public) */
    get: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        return await db.getDrillBySlug(input.drillId);
      }),

    /** List all drills including hidden ones (admin only) */
    listAdmin: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await db.getAllDrillsAdmin();
    }),

    /** Create or update a drill (admin only) */
    upsert: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        name: z.string(),
        difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
        categories: z.array(z.string()).default([]),
        duration: z.string().default(''),
        url: z.string().nullable().optional(),
        isDirectLink: z.boolean().default(false),
        ageLevel: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        problem: z.array(z.string()).optional(),
        goal: z.array(z.string()).optional(),
        drillType: z.string().nullable().optional(),
        problems: z.array(z.string()).optional(),
        outcomes: z.array(z.string()).optional(),
        source: z.enum(['static', 'custom']).default('custom'),
        isHidden: z.boolean().default(false),
        // 8 rich coaching fields
        goalOfDrill: z.string().nullable().optional(),
        whoThisDrillIsBestFor: z.string().nullable().optional(),
        coachingNotes: z.array(z.string()).nullable().optional(),
        whatThisDrillHelpsFix: z.array(z.string()).nullable().optional(),
        howToRunTheDrill: z.array(z.string()).nullable().optional(),
        commonMistakes: z.array(z.string()).nullable().optional(),
        coachSteveCue: z.string().nullable().optional(),
        gameTransferExplanation: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const result = await db.upsertDrill({
          ...input,
          createdBy: ctx.user.id,
        });
        if (!result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upsert drill' });
        return result;
      }),

    /** Soft-delete a drill (admin only) */
    hide: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const ok = await db.hideDrill(input.drillId);
        if (!ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to hide drill' });
        return { success: true };
      }),

    /** Restore a soft-deleted drill (admin only) */
    restore: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const ok = await db.restoreDrill(input.drillId);
        if (!ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to restore drill' });
        return { success: true };
      }),

    /** Permanently delete a drill (admin only) */
    deletePermanently: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const ok = await db.deleteDrillPermanently(input.drillId);
        if (!ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete drill' });
        return { success: true };
      }),

    /** Bulk upsert drills from CSV/JSON import (admin only) */
    bulkUpsert: protectedProcedure
      .input(z.object({
        rows: z.array(z.object({
          // Required for matching (update) or creating (insert)
          drillId: z.string(),
          // Required for new drills; optional for updates
          name: z.string().optional(),
          // All other fields optional — omitted fields are left unchanged on update
          difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
          categories: z.array(z.string()).optional(),
          duration: z.string().optional(),
          url: z.string().nullable().optional(),
          isDirectLink: z.boolean().optional(),
          ageLevel: z.array(z.string()).optional(),
          drillType: z.string().nullable().optional(),
          problems: z.array(z.string()).optional(),
          outcomes: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          problem: z.array(z.string()).optional(),
          goal: z.array(z.string()).optional(),
          description: z.string().nullable().optional(),
          equipment: z.array(z.string()).optional(),
          // 8 rich coaching fields
          goalOfDrill: z.string().nullable().optional(),
          whoThisDrillIsBestFor: z.string().nullable().optional(),
          coachingNotes: z.array(z.string()).nullable().optional(),
          whatThisDrillHelpsFix: z.array(z.string()).nullable().optional(),
          howToRunTheDrill: z.array(z.string()).nullable().optional(),
          commonMistakes: z.array(z.string()).nullable().optional(),
          coachSteveCue: z.string().nullable().optional(),
          gameTransferExplanation: z.string().nullable().optional(),
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const result = await db.bulkUpsertDrills(
          input.rows.map((r) => ({ ...r, createdBy: ctx.user.id }))
        );
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
