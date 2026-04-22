/**
 * Notification Service
 * Handles email logging, scheduled jobs, and automated athlete notifications.
 *
 * Use Cases:
 *   B - Blast metrics posted → email athlete
 *   C - Inactivity checker (7 days) → log to coach feed
 *   D - 24h drill deadline reminder → email athlete
 *   E - 10th drill milestone → email athlete
 */

import { eq, and, lte, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  users,
  drillAssignments,
  blastPlayers,
  notifications,
  emailNotificationLog,
  athleteActivity,
} from "../drizzle/schema";
import { sendDrillFollowUpReminder, getResend } from "./email";
import { ENV } from "./_core/env";
import { sendNotification, retryFailedNotifications, autoMarkOldNotificationsRead } from "./notificationEngine";
const BASE_URL = ENV.appUrl;

// ============================================================
// Email Notification Logger
// ============================================================

export async function logEmailNotification(data: {
  recipientId?: number;
  recipientEmail: string;
  emailType: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  metadata?: Record<string, any>;
  error?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(emailNotificationLog).values({
      recipientId: data.recipientId ?? null,
      recipientEmail: data.recipientEmail,
      emailType: data.emailType,
      subject: data.subject,
      success: data.status === "sent" ? 1 : 0,
      metadata: data.metadata ?? null,
      errorMessage: data.error ?? null,
    });
  } catch (err) {
    console.error("[NotificationLog] Failed to log email:", err);
  }
}

// ============================================================
// Use Case B: Blast Metrics Posted → Email Athlete
// ============================================================

export async function sendBlastMetricsUpdateEmail(
  playerId: string,
  sessionId: string,
  metrics: {
    batSpeedMph?: string | null;
    onPlaneEfficiencyPercent?: string | null;
    attackAngleDeg?: string | null;
    exitVelocityMph?: string | null;
  },
  sessionType: string,
  sessionDate: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [player] = await db
      .select({ userId: blastPlayers.userId, fullName: blastPlayers.fullName })
      .from(blastPlayers)
      .where(eq(blastPlayers.id, playerId))
      .limit(1);

    if (!player?.userId) return false;

    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, player.userId))
      .limit(1);

    if (!user?.email) return false;

    const metricLines: string[] = [];
    if (metrics.batSpeedMph) metricLines.push(`🏏 Bat Speed: <strong>${metrics.batSpeedMph} mph</strong>`);
    if (metrics.onPlaneEfficiencyPercent) metricLines.push(`📐 On-Plane Efficiency: <strong>${metrics.onPlaneEfficiencyPercent}%</strong>`);
    if (metrics.attackAngleDeg) metricLines.push(`📏 Attack Angle: <strong>${metrics.attackAngleDeg}°</strong>`);
    if (metrics.exitVelocityMph) metricLines.push(`⚡ Exit Velocity: <strong>${metrics.exitVelocityMph} mph</strong>`);

    const formattedDate = new Date(sessionDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0A1628 0%, #e4002b 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
    .metrics-card { background: white; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #e4002b; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .metrics-card h3 { margin: 0 0 16px 0; color: #0A1628; font-size: 16px; }
    .metric-row { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 15px; }
    .metric-row:last-child { border-bottom: none; }
    .cta-button { display: inline-block; background: #e4002b; color: white; padding: 13px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📊 New Swing Metrics Posted</h1>
        <p>${sessionType} Session — ${formattedDate}</p>
      </div>
      <div class="content">
        <p>Hi ${user.name || "Athlete"},</p>
        <p>Your coach has posted new Blast Motion metrics from your recent session. Check out your numbers below!</p>
        <div class="metrics-card">
          <h3>Session Results</h3>
          ${metricLines.map(l => `<div class="metric-row">${l}</div>`).join("")}
        </div>
        <div style="text-align: center;">
          <a href="${BASE_URL}/athlete-portal" class="cta-button">View Full Dashboard</a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Log in to your portal to see your metrics trend over time. Keep grinding — the numbers don't lie! ⚾</p>
      </div>
      <div class="footer"><p>Coach Steve Baseball — Player Drill Library</p></div>
    </div>
  </body>
</html>`;

    if (!ENV.resendApiKey) return false;

    const result = await getResend().emails.send({
      from: ENV.resendFromEmail,
      ...(ENV.resendReplyTo ? { replyTo: ENV.resendReplyTo } : {}),
      to: user.email,
      subject: `⚾ New Swing Metrics Posted — ${sessionType} Session`,
      html: emailHtml,
    });

    const success = !result.error;
    await logEmailNotification({
      recipientId: player.userId,
      recipientEmail: user.email,
      emailType: "blast_metrics_update",
      subject: `New Swing Metrics Posted — ${sessionType} Session`,
      status: success ? "sent" : "failed",
      metadata: { sessionId, sessionType, sessionDate },
      error: result.error?.message,
    });

    console.log(`[NotificationService] Blast metrics email ${success ? "sent" : "failed"} to ${user.email}`);
    return success;
  } catch (err) {
    console.error("[NotificationService] sendBlastMetricsUpdateEmail error:", err);
    return false;
  }
}

// ============================================================
// Use Case D: 24h Drill Deadline Reminder (Scheduled Job)
// ============================================================

export async function runDrillDeadlineReminderJob(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueAssignments = await db
      .select({
        id: drillAssignments.id,
        userId: drillAssignments.userId,
        drillName: drillAssignments.drillName,
        dueDate: drillAssignments.dueDate,
        status: drillAssignments.status,
      })
      .from(drillAssignments)
      .where(
        and(
          eq(drillAssignments.reminderSent, 0),
          eq(drillAssignments.status, "assigned"),
          lte(drillAssignments.dueDate, in24h),
          gte(drillAssignments.dueDate, now)
        )
      );

    if (dueAssignments.length === 0) return 0;

    // Group by userId
    const byUser = new Map<number, typeof dueAssignments>();
    for (const a of dueAssignments) {
      if (!a.userId) continue;
      const existing = byUser.get(a.userId) || [];
      existing.push(a);
      byUser.set(a.userId, existing);
    }

    let sent = 0;

    for (const [userId, assignments] of Array.from(byUser.entries())) {
      const [user] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user?.email) continue;

      const result = await sendDrillFollowUpReminder({
        athleteEmail: user.email,
        athleteName: user.name || "Athlete",
        drills: assignments.map((a: any) => ({
          name: a.drillName,
          assignedDate: a.dueDate
            ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "No due date",
          status: a.status,
        })),
        coachName: "Coach Steve",
        portalUrl: `${BASE_URL}/athlete-portal`,
      });

      if (result.success) {
        for (const a of assignments) {
          await db
            .update(drillAssignments)
            .set({ reminderSent: 1 })
            .where(eq(drillAssignments.id, a.id));
        }

        await logEmailNotification({
          recipientId: userId,
          recipientEmail: user.email,
          emailType: "drill_deadline_reminder",
          subject: `Drill Reminder: ${assignments.length} drill${assignments.length > 1 ? "s" : ""} due soon`,
          status: "sent",
          metadata: { drillCount: assignments.length, drillIds: assignments.map((a: any) => a.id) },
        });

        sent++;
      }
    }

    console.log(`[NotificationService] Drill deadline reminders sent to ${sent} athletes`);
    return sent;
  } catch (err) {
    console.error("[NotificationService] runDrillDeadlineReminderJob error:", err);
    return 0;
  }
}

// ============================================================
// Use Case C: Inactivity Checker (7 days) → Coach Feed
// ============================================================

export async function runInactivityCheckerJob(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const athletes = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "athlete"), eq(users.isActiveClient, 1)));

    let flagged = 0;

    for (const athlete of athletes) {
      const [lastActivity] = await db
        .select({ createdAt: athleteActivity.createdAt })
        .from(athleteActivity)
        .where(eq(athleteActivity.athleteId, athlete.id))
        .orderBy(sql`${athleteActivity.createdAt} DESC`)
        .limit(1);

      const isInactive = !lastActivity || new Date(lastActivity.createdAt) < cutoff;
      if (!isInactive) continue;

      const daysSince = lastActivity
        ? Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const coaches = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`${users.role} IN ('admin', 'coach')`);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const coach of coaches) {
        // Avoid duplicate inactivity notifications same day
        const alreadyFlagged = await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, coach.id),
              eq(notifications.relatedId, String(athlete.id)),
              gte(notifications.createdAt, todayStart),
              sql`${notifications.relatedType} = 'inactivity_flag'`
            )
          )
          .limit(1);

        if (alreadyFlagged.length > 0) continue;

        await sendNotification({
          userId: coach.id,
          type: "system",
          title: "Athlete Inactive",
          message: `${athlete.name || athlete.email} has been inactive for ${daysSince ?? "7+"} days`,
          relatedId: String(athlete.id),
          relatedType: "inactivity_flag",
          linkUrl: `/coach-dashboard?athlete=${athlete.id}`,
          portalOnly: true, // Coach-facing alert, no email
        });
      }

      flagged++;
    }

    console.log(`[NotificationService] Inactivity checker flagged ${flagged} athletes`);
    return flagged;
  } catch (err) {
    console.error("[NotificationService] runInactivityCheckerJob error:", err);
    return 0;
  }
}

// ============================================================
// Use Case E: 10th Drill Milestone Email
// ============================================================

export async function checkAndSendMilestoneEmail(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(drillAssignments)
      .where(
        and(
          eq(drillAssignments.userId, userId),
          eq(drillAssignments.status, "completed"),
          gte(drillAssignments.completedAt, monthStart)
        )
      );

    const completionsThisMonth = Number(result?.count) || 0;
    if (completionsThisMonth !== 10) return false;

    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.email) return false;

    // Check if milestone email already sent this month
    const alreadySent = await db
      .select({ id: emailNotificationLog.id })
      .from(emailNotificationLog)
      .where(
        and(
          eq(emailNotificationLog.recipientId, userId),
          eq(emailNotificationLog.emailType, "milestone_10_drills"),
          gte(emailNotificationLog.createdAt, monthStart)
        )
      )
      .limit(1);

    if (alreadySent.length > 0) return false;

    const monthName = now.toLocaleDateString("en-US", { month: "long" });

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
    .milestone-badge { background: white; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; border: 2px solid #10b981; }
    .milestone-badge .number { font-size: 64px; font-weight: bold; color: #10b981; line-height: 1; }
    .milestone-badge .label { font-size: 18px; color: #374151; margin-top: 8px; }
    .quote { background: #ecfdf5; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; font-style: italic; color: #065f46; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 13px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Milestone Unlocked!</h1>
        <p>You're on fire, ${user.name || "Athlete"}!</p>
      </div>
      <div class="content">
        <p>Hi ${user.name || "Athlete"},</p>
        <p>You just hit a massive milestone — <strong>10 drills completed in ${monthName}</strong>! That kind of consistency is exactly what separates good players from great ones.</p>
        <div class="milestone-badge">
          <div class="number">10</div>
          <div class="label">Drills Completed in ${monthName} 🏆</div>
        </div>
        <div class="quote">
          "Process over outcome. You're doing the work that shows up on game day." — Coach Steve
        </div>
        <div style="text-align: center;">
          <a href="${BASE_URL}/athlete-portal" class="cta-button">Keep the Streak Going</a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Your coach is watching your progress and couldn't be prouder. Keep grinding!</p>
      </div>
      <div class="footer"><p>Coach Steve Baseball — Player Drill Library</p></div>
    </div>
  </body>
</html>`;

    if (!ENV.resendApiKey) return false;

    const sendResult = await getResend().emails.send({
      from: ENV.resendFromEmail,
      ...(ENV.resendReplyTo ? { replyTo: ENV.resendReplyTo } : {}),
      to: user.email,
      subject: `🏆 Milestone: 10 Drills Completed in ${monthName}!`,
      html: emailHtml,
    });

    const success = !sendResult.error;
    await logEmailNotification({
      recipientId: userId,
      recipientEmail: user.email,
      emailType: "milestone_10_drills",
      subject: `Milestone: 10 Drills Completed in ${monthName}!`,
      status: success ? "sent" : "failed",
      metadata: { completionsThisMonth, month: monthName },
      error: sendResult.error?.message,
    });

    console.log(`[NotificationService] Milestone email ${success ? "sent" : "failed"} to ${user.email}`);
    return success;
  } catch (err) {
    console.error("[NotificationService] checkAndSendMilestoneEmail error:", err);
    return false;
  }
}

// ============================================================
// Scheduled Job Runner
// ============================================================

let scheduledJobIntervals: NodeJS.Timeout[] = [];

export function startScheduledJobs(): void {
  if (scheduledJobIntervals.length > 0) {
    console.log("[NotificationService] Scheduled jobs already running");
    return;
  }

  // Drill deadline reminders — every hour
  const deadlineInterval = setInterval(async () => {
    await runDrillDeadlineReminderJob();
  }, 60 * 60 * 1000);
  scheduledJobIntervals.push(deadlineInterval);

  // Inactivity checker — every 6 hours
  const inactivityInterval = setInterval(async () => {
    await runInactivityCheckerJob();
  }, 6 * 60 * 60 * 1000);
  scheduledJobIntervals.push(inactivityInterval);

  // Retry failed email notifications — every 5 minutes
  const retryInterval = setInterval(async () => {
    const result = await retryFailedNotifications();
    if (result.retried > 0) {
      console.log(`[NotificationService] Retried ${result.retried} failed emails, ${result.succeeded} succeeded`);
      // Notify coach if any emails permanently failed (retried 3 times)
      await notifyCoachOfFailedEmails();
    }
  }, 5 * 60 * 1000);
  scheduledJobIntervals.push(retryInterval);

  // 30-day auto-mark-read — every 24 hours
  const autoMarkReadInterval = setInterval(async () => {
    const result = await autoMarkOldNotificationsRead();
    if (result.marked > 0) {
      console.log(`[NotificationService] Auto-marked ${result.marked} old notifications as read`);
    }
  }, 24 * 60 * 60 * 1000);
  scheduledJobIntervals.push(autoMarkReadInterval);

  console.log("[NotificationService] Scheduled jobs started (deadline: 1h, inactivity: 6h, retry: 5m, auto-mark-read: 24h)");

  // Run immediately on startup
  runDrillDeadlineReminderJob();
  runInactivityCheckerJob();
  retryFailedNotifications();
  autoMarkOldNotificationsRead();
}

// ============================================================
// Notify Coach When Athlete Emails Permanently Fail
// ============================================================

async function notifyCoachOfFailedEmails(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Find notifications that have failed 3+ times and coach hasn't been notified yet
    const permanentlyFailed = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        recipientEmail: notifications.recipientEmail,
        title: notifications.title,
        type: notifications.type,
        lastError: notifications.lastError,
        retryCount: notifications.retryCount,
        metadata: notifications.metadata,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.emailStatus, "failed"),
          gte(notifications.retryCount, 3)
        )
      )
      .limit(20);

    if (permanentlyFailed.length === 0) return;

    // Get all coaches
    const coaches = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(sql`${users.role} IN ('admin', 'coach')`);

    for (const failedNotif of permanentlyFailed) {
      // Look up the athlete name
      const [athlete] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, failedNotif.userId))
        .limit(1);

      const athleteName = athlete?.name || athlete?.email || `User #${failedNotif.userId}`;
      const dedupeKey = `failed_email_alert_${failedNotif.id}`;

      for (const coach of coaches) {
        await sendNotification({
          userId: coach.id,
          type: "system",
          title: "Email Delivery Failed",
          message: `Failed to deliver email to ${athleteName} (${failedNotif.recipientEmail}): "${failedNotif.title}". Error: ${failedNotif.lastError || "Unknown"}. Retried ${failedNotif.retryCount} times.`,
          relatedId: String(failedNotif.id),
          relatedType: "email_failure",
          linkUrl: "/coach-dashboard",
          dedupeKey,
          portalOnly: false, // Email the coach about the failure
        });
      }

      // Mark the failed notification so we don't keep alerting about it
      // Set retryCount to a high number to prevent further retries
      await db.update(notifications)
        .set({ retryCount: 99 })
        .where(eq(notifications.id, failedNotif.id));
    }

    console.log(`[NotificationService] Notified coaches about ${permanentlyFailed.length} permanently failed emails`);
  } catch (err) {
    console.error("[NotificationService] notifyCoachOfFailedEmails error:", err);
  }
}

export function stopScheduledJobs(): void {
  for (const interval of scheduledJobIntervals) {
    clearInterval(interval);
  }
  scheduledJobIntervals = [];
  console.log("[NotificationService] Scheduled jobs stopped");
}
