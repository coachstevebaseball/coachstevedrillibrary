import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const submissionsRouter = router({
  // Drill submissions router for athlete feedback
  drillSubmissions: router({
    createSubmission: protectedProcedure
      .input(z.object({
        assignmentId: z.number(),
        drillId: z.string(),
        notes: z.string().optional(),
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        const result = await db.createDrillSubmission({
          assignmentId: input.assignmentId,
          userId: ctx.user.id,
          drillId: input.drillId,
          notes: input.notes || null,
          videoUrl: input.videoUrl || null,
        });
        return { success: !!result };
      }),

    getSubmissionsByAssignment: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubmissionsByAssignment(input.assignmentId);
      }),

    getSubmissionsByUser: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        return await db.getSubmissionsByUser(ctx.user.id);
      }),

    updateSubmission: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        notes: z.string().optional(),
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        const submissions = await db.getSubmissionsByUser(ctx.user.id);
        const submission = submissions.find(s => s.id === input.submissionId);
        if (!submission) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot update submission you do not own' });
        }
        const success = await db.updateDrillSubmission(input.submissionId, {
          notes: input.notes,
          videoUrl: input.videoUrl,
        });
        return { success };
      }),

    deleteSubmission: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        const submissions = await db.getSubmissionsByUser(ctx.user.id);
        const submission = submissions.find(s => s.id === input.submissionId);
        if (!submission) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete submission you do not own' });
        }
        const success = await db.deleteDrillSubmission(input.submissionId);
        return { success };
      }),
  }),

  // Coach feedback router
  coachFeedback: router({
    createFeedback: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        userId: z.number(),
        drillId: z.string(),
        feedback: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach access required' });
        }
        const result = await db.createCoachFeedback({
          submissionId: input.submissionId,
          coachId: ctx.user.id,
          userId: input.userId,
          drillId: input.drillId,
          feedback: input.feedback,
        });
        return { success: !!result };
      }),

    getFeedbackBySubmission: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFeedbackBySubmission(input.submissionId);
      }),

    getFeedbackByDrill: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        return await db.getFeedbackByDrill(input.drillId, ctx.user.id);
      }),

    updateFeedback: protectedProcedure
      .input(z.object({
        feedbackId: z.number(),
        feedback: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach access required' });
        }
        const success = await db.updateCoachFeedback(input.feedbackId, input.feedback);
        return { success };
      }),

    deleteFeedback: protectedProcedure
      .input(z.object({ feedbackId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach access required' });
        }
        const success = await db.deleteCoachFeedback(input.feedbackId);
        return { success };
      }),
  }),
});
