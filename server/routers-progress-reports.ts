import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as sessionNotesDb from "./sessionNotes";
import { Resend } from "resend";
import { ENV } from "./_core/env";

const resend = new Resend(ENV.resendApiKey);

/** Coach Steve's voice/tone system prompt for AI report generation */
const COACH_STEVE_SYSTEM_PROMPT = `You are Coach Steve Goldstein, an elite baseball instructor who trains players ages 6–18 with a process-driven, measurable-growth approach. You are writing a progress report to send to a player's parent after a training session.

Your writing voice is:
- Confident and knowledgeable — you clearly know what you're talking about
- Parent-friendly — warm but professional, never condescending
- Reassuring — parents should feel their kid is in great hands
- Direct — get to the point, no fluff or filler
- Motivating — always end on a positive, encouraging note
- NEVER generic or robotic — every report should feel personal and specific to the player

Here is an example of your exact writing tone (match this voice precisely):

"Hi [Parent Name],

Great session with [Player] today. We spent the majority of our time working on staying connected through the swing — specifically keeping the hands inside the ball and driving through contact rather than pulling off early.

What stood out: [Player] made a real adjustment by the second round of front toss and was consistently barreling balls to the middle and opposite field. That's not easy to do in one session — shows a great feel for the barrel.

What we're building on: We still need to clean up the load timing — there's a small hitch that's causing some inconsistency. I've assigned two drills in the portal for this week that will help reinforce the timing piece.

Overall, really encouraged by today. The effort and focus were there. Keep it up.

— Coach Steve"

IMPORTANT RULES:
- Use the player's first name naturally throughout
- Reference specific drills and skills from the session notes
- The "What stood out" section should highlight genuine positives with specific detail
- The "What we're building on" section should be honest but constructive
- If homework drills are assigned, mention them naturally
- End with a short motivating note directly to the player (1-2 sentences)
- Keep the overall length to 200-350 words
- Do NOT use bullet points — write in natural paragraphs
- Sign off as "— Coach Steve"
- Use the tagline "Elite Instruction. Measurable Growth." in the branded footer`;

/** Structured report content schema */
const reportContentSchema = {
  type: "object" as const,
  properties: {
    greeting: { type: "string" as const, description: "Opening greeting to the parent" },
    sessionSummary: { type: "string" as const, description: "What was covered in the session" },
    strengths: { type: "string" as const, description: "What stood out / strengths observed" },
    areasForImprovement: { type: "string" as const, description: "What we're building on / areas for improvement" },
    homeworkAndNextSteps: { type: "string" as const, description: "Recommended next steps and homework drills" },
    playerNote: { type: "string" as const, description: "Short motivating note directly to the player" },
    signOff: { type: "string" as const, description: "Sign-off line" },
  },
  required: ["greeting", "sessionSummary", "strengths", "areasForImprovement", "homeworkAndNextSteps", "playerNote", "signOff"] as const,
  additionalProperties: false as const,
};

export const progressReportsRouter = router({
  /** Generate an AI progress report from a session note */
  generate: protectedProcedure
    .input(
      z.object({
        sessionNoteId: z.number(),
        parentName: z.string().optional(),
        parentEmail: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coach") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }

      // Get the session note
      const note = await sessionNotesDb.getSessionNoteById(input.sessionNoteId);
      if (!note) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session note not found" });
      }

      // Get athlete info
      const athleteData = await sessionNotesDb.getSessionNotesWithAthleteName(note.athleteId);
      const athleteName = athleteData.athleteName;
      const athleteFirstName = athleteName.split(" ")[0];

      // Get recent session history for context
      const recentNotes = await sessionNotesDb.getRecentSessionNotes(note.athleteId, 3);

      // Build the user prompt with session data
      const skillsWorked = (note.skillsWorked as string[]) ?? [];
      const homeworkDrills = (note.homeworkDrills as Array<{ drillId: string; drillName: string }>) ?? [];
      const sessionDate = new Date(note.sessionDate);

      const parentNameStr = input.parentName || "there";

      let contextFromPreviousSessions = "";
      if (recentNotes.length > 1) {
        const prevNotes = recentNotes.filter((n) => n.id !== note.id).slice(0, 2);
        if (prevNotes.length > 0) {
          contextFromPreviousSessions = `\n\nPrevious session context (for continuity):\n${prevNotes
            .map(
              (pn) =>
                `- Session #${pn.sessionNumber}: Worked on ${(pn.skillsWorked as string[]).join(", ")}. Improved: ${pn.whatImproved}. Needs work: ${pn.whatNeedsWork}`
            )
            .join("\n")}`;
        }
      }

      const userPrompt = `Write a progress report for the following session:

Player Name: ${athleteName} (use "${athleteFirstName}" in the report)
Parent Name: ${parentNameStr}
Session Date: ${sessionDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
Session Number: #${note.sessionNumber}
Skills Worked On: ${skillsWorked.join(", ")}
Duration: ${note.duration ? `${note.duration} minutes` : "Standard session"}

What Improved This Session:
${note.whatImproved}

What Still Needs Work:
${note.whatNeedsWork}

${homeworkDrills.length > 0 ? `Homework Drills Assigned:\n${homeworkDrills.map((d) => `- ${d.drillName}`).join("\n")}` : "No specific homework drills assigned this session."}

${note.overallRating ? `Coach's Session Rating: ${note.overallRating}/5` : ""}
${contextFromPreviousSessions}

Generate the progress report in your voice. Return it as structured JSON.`;

      // Call LLM
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: COACH_STEVE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "progress_report",
            strict: true,
            schema: reportContentSchema,
          },
        },
      });

      const reportContent = JSON.parse(
        llmResult.choices[0]?.message?.content as string
      );

      // Generate the full HTML report
      const reportHtml = generateReportHtml({
        athleteName,
        sessionDate,
        sessionNumber: note.sessionNumber,
        reportContent,
      });

      // Save to database
      const title = `Session #${note.sessionNumber} Progress Report — ${sessionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

      const report = await sessionNotesDb.createProgressReport({
        coachId: ctx.user.id,
        athleteId: note.athleteId,
        sessionNoteId: note.id,
        title,
        reportContent,
        reportHtml,
        status: "draft",
        sentToEmail: input.parentEmail ?? null,
        sentToName: input.parentName ?? null,
      });

      return report;
    }),

  /** Get a progress report by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await sessionNotesDb.getProgressReportById(input.id);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }
      return report;
    }),

  /** Get all reports for an athlete */
  getForAthlete: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .query(async ({ input }) => {
      return sessionNotesDb.getProgressReportsForAthlete(input.athleteId);
    }),

  /** Update report content (inline editing) */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reportContent: z.record(z.string(), z.string()).optional(),
        reportHtml: z.string().optional(),
        status: z.enum(["draft", "reviewed", "sent"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coach") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      const { id, ...data } = input;
      return sessionNotesDb.updateProgressReport(id, data as any);
    }),

  /** Send report to parent via email */
  sendToParent: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        parentEmail: z.string().email(),
        parentName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coach") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }

      const report = await sessionNotesDb.getProgressReportById(input.reportId);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }

      if (!ENV.resendApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Email service not configured",
        });
      }

      // Get athlete name for subject line
      const athleteData = await sessionNotesDb.getSessionNotesWithAthleteName(report.athleteId);

      try {
        const result = await resend.emails.send({
          from: "coach@coachstevemobilecoach.com",
          to: input.parentEmail,
          subject: `${athleteData.athleteName} — ${report.title}`,
          html: report.reportHtml as string,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Update report status
        await sessionNotesDb.updateProgressReport(report.id, {
          status: "sent",
          sentAt: new Date(),
          sentToEmail: input.parentEmail,
          sentToName: input.parentName ?? null,
        } as any);

        return { success: true };
      } catch (error) {
        console.error("[ProgressReport] Failed to send email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /** Delete a report */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coach") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
      }
      return sessionNotesDb.deleteProgressReport(input.id);
    }),
});

/** Generate branded HTML for the progress report email */
function generateReportHtml(params: {
  athleteName: string;
  sessionDate: Date;
  sessionNumber: number;
  reportContent: {
    greeting: string;
    sessionSummary: string;
    strengths: string;
    areasForImprovement: string;
    homeworkAndNextSteps: string;
    playerNote: string;
    signOff: string;
  };
}): string {
  const { athleteName, sessionDate, sessionNumber, reportContent } = params;
  const dateStr = sessionDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #1a1a2e; margin: 0; padding: 0; background-color: #f0f2f5; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%); color: white; padding: 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header .tagline { font-size: 13px; color: #60a5fa; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
    .meta { background: #1e3a5f; color: #94a3b8; padding: 14px 32px; font-size: 13px; display: flex; justify-content: space-between; }
    .meta span { display: inline-block; }
    .content { background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; }
    .content p { margin: 0 0 16px 0; font-size: 15px; color: #334155; }
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 24px 0 8px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
    .section-label.strengths { color: #16a34a; border-color: #bbf7d0; }
    .section-label.improvement { color: #d97706; border-color: #fde68a; }
    .section-label.homework { color: #2563eb; border-color: #bfdbfe; }
    .player-note { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .player-note p { color: #1e40af; font-style: italic; margin: 0; }
    .sign-off { margin-top: 24px; font-weight: 600; color: #0a1628; font-size: 15px; }
    .footer { background: #0a1628; color: #94a3b8; padding: 24px 32px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; }
    .footer .brand { color: #60a5fa; font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .footer .tagline-footer { color: #64748b; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Coach Steve</h1>
      <div class="tagline">Elite Instruction. Measurable Growth.</div>
    </div>
    <div class="meta">
      <span>${athleteName} — Session #${sessionNumber}</span>
      <span>${dateStr}</span>
    </div>
    <div class="content">
      <p>${reportContent.greeting}</p>
      <p>${reportContent.sessionSummary}</p>

      <div class="section-label strengths">What Stood Out</div>
      <p>${reportContent.strengths}</p>

      <div class="section-label improvement">What We're Building On</div>
      <p>${reportContent.areasForImprovement}</p>

      <div class="section-label homework">Next Steps & Homework</div>
      <p>${reportContent.homeworkAndNextSteps}</p>

      <div class="player-note">
        <p>${reportContent.playerNote}</p>
      </div>

      <div class="sign-off">${reportContent.signOff}</div>
    </div>
    <div class="footer">
      <div class="brand">Coach Steve Goldstein</div>
      <div class="tagline-footer">Elite Instruction. Measurable Growth.</div>
    </div>
  </div>
</body>
</html>`;
}
