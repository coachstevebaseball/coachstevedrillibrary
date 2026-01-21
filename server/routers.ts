import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import * as drillAssignmentDb from "./drillAssignments";
import * as inviteDb from "./invites";
import { drillGeneratorRouter } from "./routers-drill-generator";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
  }),

  // Drill assignment router for coach dashboard
  drillAssignments: router({
    assignDrill: protectedProcedure
      .input(z.object({
        userId: z.number(),
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
        await drillAssignmentDb.assignDrill(
          input.userId,
          input.drillId,
          input.drillName,
          input.notes,
          ctx.user.name || 'Coach',
          { difficulty: input.difficulty || 'Unknown', duration: input.duration || 'Unknown' }
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
    
    updateStatus: protectedProcedure
      .input(z.object({ assignmentId: z.number(), status: z.enum(["assigned", "in-progress", "completed"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await drillAssignmentDb.updateAssignmentStatus(input.assignmentId, input.status);
        return { success: true };
      }),
    
    getUserAssignments: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot view other users assignments' });
        }
        return await drillAssignmentDb.getUserAssignments(input.userId);
      }),
    
    getAllAssignments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return await drillAssignmentDb.getAllAssignments();
    }),
    
    getAssignmentProgress: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .query(async ({ input }) => {
        return await drillAssignmentDb.getAssignmentProgress(input.assignmentId);
      }),
  }),

  // Drill Generator router
  drillGenerator: drillGeneratorRouter,

  // Drill videos router
  videos: router({
    saveVideo: protectedProcedure
      .input(z.object({ drillId: z.string(), videoUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        const success = await db.saveOrUpdateDrillVideo(input.drillId, input.videoUrl, ctx.user.id);
        return { success };
      }),
    
    getVideo: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        const video = await db.getDrillVideo(input.drillId);
        return video || null;
      }),
    
    getAllVideos: publicProcedure.query(async () => {
      return await db.getAllDrillVideos();
    }),
    
    deleteVideo: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        const success = await db.deleteDrillVideo(input.drillId);
        return { success };
      }),
  }),

  // Drill Details management router
  drillDetails: router({
    saveDrillDetail: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        skillSet: z.string(),
        difficulty: z.string(),
        athletes: z.string(),
        time: z.string(),
        equipment: z.string(),
        goal: z.string(),
        description: z.array(z.string()),
        commonMistakes: z.array(z.string()).optional(),
        progressions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        const success = await db.saveDrillDetail(input.drillId, {
          skillSet: input.skillSet,
          difficulty: input.difficulty,
          athletes: input.athletes,
          time: input.time,
          equipment: input.equipment,
          goal: input.goal,
          description: input.description,
          commonMistakes: input.commonMistakes,
          progressions: input.progressions,
        }, ctx.user.id);
        return { success };
      }),
    
    getDrillDetail: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
        const detail = await db.getDrillDetail(input.drillId);
        return detail || null;
      }),
    
    deleteDrillDetail: protectedProcedure
      .input(z.object({ drillId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        const success = await db.deleteDrillDetail(input.drillId);
        return { success };
      }),
    
    saveDrillInstructions: protectedProcedure
      .input(z.object({
        drillId: z.string(),
        instructions: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        const success = await db.saveDrillInstructions(input.drillId, input.instructions, ctx.user.id);
        return { success };
      }),
    
    bulkUpdateInstructions: protectedProcedure
      .input(z.object({
        instructions: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'coach') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach or admin access required' });
        }
        
        const results: Array<{ drillName: string; success: boolean; error?: string }> = [];
        
        for (const [drillName, instructions] of Object.entries(input.instructions)) {
          try {
            // Find drill ID by name (case-insensitive)
            const drillId = drillName.toLowerCase().replace(/\s+/g, '-');
            await db.saveDrillInstructions(drillId, instructions, ctx.user.id);
            results.push({ drillName, success: true });
          } catch (error) {
            results.push({
              drillName,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        
        return { results };
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });
        }
        return {
          valid: inviteDb.isInviteValid(invite),
          email: invite.email,
          expiresAt: invite.expiresAt,
        };
      }),
    
    acceptInvite: publicProcedure
      .input(z.object({ token: z.string(), userId: z.number() }))
      .mutation(async ({ input }) => {
        return await inviteDb.acceptInvite(input.token, input.userId);
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
  }),
});

export type AppRouter = typeof appRouter;
