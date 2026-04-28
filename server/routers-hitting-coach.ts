import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { hittingCoachUsage } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/** Maximum messages per user per day (configurable) */
const DAILY_LIMIT = 20;

const COACH_STEVE_SYSTEM = `You are Coach Steve, an elite baseball hitting instructor. Your background:
- Division I All-American at Stony Brook University (Louisville Slugger Freshman All-American, 2012)
- 2012 College World Series participant — helped lead Stony Brook on a legendary Cinderella run
- Cape Cod League veteran — teammates included Aaron Judge, Kyle Schwarber, Michael Lorenzen, Tony Kemp
- Coaching philosophy: "Process Over Outcome" — you measure success by Quality At-Bat percentage (QAB%), not batting average
- You coach 70+ athletes ages 6-18 at Common Sense Baseball in Westbury, NY and Long Island Elite Baseball
- Deep expertise in Blast Motion metrics: bat speed, on-plane efficiency, attack angle, rotational acceleration

Your voice: Direct. Confident. Warm but no fluff. You tell athletes what they NEED to hear, not what they want to hear. You believe vision and pitch recognition come BEFORE mechanics. You use data and have played against MLB-level talent.

When an athlete describes a hitting problem, respond in this EXACT structure using markdown:

## What's Happening
2-3 sentences diagnosing the root cause. Be specific — not just "your swing is off" but WHY mechanically or mentally it's happening.

## The Fix — 3 Drills

**Drill 1: [Name]**
Equipment: [what they need]
1. Step one
2. Step two
3. Step three
Feel for: [what they should feel when doing it right]

**Drill 2: [Name]**
Equipment: [what they need]
1. Step one
2. Step two
3. Step three
Feel for: [what they should feel when doing it right]

**Drill 3: [Name]**
Equipment: [what they need]
1. Step one
2. Step two
3. Step three
Feel for: [what they should feel when doing it right]

## Coaching Cues
- [Cue 1 — short, physical, repeatable]
- [Cue 2 — short, physical, repeatable]
- [Cue 3 — short, physical, repeatable]

## Mental Approach
One paragraph (3-5 sentences) on the mental side of this specific issue. Connect it to process over outcome. Real talk — no generic motivation.

## QAB Impact
One sentence on how fixing this directly improves their Quality At-Bat percentage.

---
Keep total response under 550 words. Speak directly to the athlete using "you" and "your." Be a coach, not a textbook.`;

/**
 * Get today's date string in YYYY-MM-DD format (UTC).
 */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check and increment the daily usage counter for a user.
 * Returns the current count BEFORE incrementing.
 * Throws TRPCError if the limit is exceeded.
 */
async function enforceRateLimit(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    // If DB is unavailable, allow the request but log a warning
    console.warn("[HittingCoach] Rate limit check skipped — DB unavailable");
    return 0;
  }

  const today = todayUTC();

  // Get or create today's usage row
  const existing = await db
    .select()
    .from(hittingCoachUsage)
    .where(and(eq(hittingCoachUsage.userId, userId), eq(hittingCoachUsage.usageDate, today)))
    .limit(1);

  if (existing.length > 0) {
    const currentCount = existing[0].messageCount;
    if (currentCount >= DAILY_LIMIT) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `You've reached your daily limit of ${DAILY_LIMIT} messages. Try again tomorrow.`,
      });
    }
    // Increment
    await db
      .update(hittingCoachUsage)
      .set({ messageCount: currentCount + 1 })
      .where(eq(hittingCoachUsage.id, existing[0].id));
    return currentCount + 1;
  } else {
    // First message today
    await db.insert(hittingCoachUsage).values({
      userId,
      usageDate: today,
      messageCount: 1,
    });
    return 1;
  }
}

export const hittingCoachRouter = router({
  ask: protectedProcedure
    .input(
      z.object({
        message: z.string().min(3, "Describe your hitting issue").max(500),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "model"]),
              content: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Enforce per-user daily rate limit
      const usageCount = await enforceRateLimit(ctx.user.id);
      console.log(`[HittingCoach] User ${ctx.user.id} usage today: ${usageCount}/${DAILY_LIMIT}`);

      try {
        let response: string;

        // Try Gemini first, fall back to forge proxy if Gemini fails or key missing
        let geminiError: Error | null = null;

        if (ENV.geminiApiKey) {
          try {
            const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);
            const model = genAI.getGenerativeModel({
              model: "gemini-1.5-flash",
              systemInstruction: COACH_STEVE_SYSTEM,
            });
            const history = input.history.map((m) => ({
              role: m.role,
              parts: [{ text: m.content }],
            }));
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(input.message);
            response = result.response.text();
            console.log("[HittingCoach] Responded via Gemini");
          } catch (err) {
            geminiError = err instanceof Error ? err : new Error(String(err));
            console.warn("[HittingCoach] Gemini failed, falling back to forge:", geminiError.message);
          }
        }

        // Use forge proxy if Gemini not available or failed
        if (!response! && ENV.forgeApiKey) {
          const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
            { role: "system", content: COACH_STEVE_SYSTEM },
            ...input.history.map((m) => ({
              role: m.role === "model" ? ("assistant" as const) : ("user" as const),
              content: m.content,
            })),
            { role: "user", content: input.message },
          ];
          const result = await invokeLLM({ messages });
          const forgeContent = result.choices?.[0]?.message?.content;
          if (!forgeContent || typeof forgeContent !== "string") {
            throw new Error("No response from AI coach");
          }
          response = forgeContent;
          console.log("[HittingCoach] Responded via forge proxy");
        }

        if (!response!) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI coach is not configured. Contact Coach Steve.",
          });
        }

        return { success: true, response, dailyUsage: usageCount, dailyLimit: DAILY_LIMIT };
      } catch (error) {
        console.error("[HittingCoach] Error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Coach Steve is unavailable right now. Try again.",
        });
      }
    }),

  /** Get current daily usage for the logged-in user */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT };

    const today = todayUTC();
    const existing = await db
      .select()
      .from(hittingCoachUsage)
      .where(and(eq(hittingCoachUsage.userId, ctx.user.id), eq(hittingCoachUsage.usageDate, today)))
      .limit(1);

    const used = existing.length > 0 ? existing[0].messageCount : 0;
    return { used, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - used };
  }),
});
