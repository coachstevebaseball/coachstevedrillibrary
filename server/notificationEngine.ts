/**
 * Centralized Notification Engine
 * 
 * Single entry point for all notifications in the system.
 * Handles: DB persistence, user preference checks, email delivery via Resend,
 * delivery status tracking, retry logic, and deduplication.
 */

import { getDb } from "./db";
import { notifications, notificationPreferences, users } from "../drizzle/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
import { getResend } from "./email";
import { ENV } from "./_core/env";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | "drill_assigned"
  | "notes_added"
  | "recap_posted"
  | "swing_analysis_ready"
  | "new_feature_available"
  | "feedback_received"
  | "submission_received"
  | "badge_earned"
  | "practice_plan_shared"
  | "welcome"
  | "system";

export interface SendNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  recipientEmail?: string; // If not provided, looked up from users table
  linkUrl?: string;
  relatedId?: string;
  relatedType?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
  /** Skip email even if preferences allow it (portal-only notification) */
  portalOnly?: boolean;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: number;
  emailSent?: boolean;
  error?: string;
}

// ─── Preference → Type Mapping ───────────────────────────────────────────────

const TYPE_TO_PREFERENCE: Record<NotificationType, string> = {
  drill_assigned: "drillAssignments",
  notes_added: "notesUpdates",
  recap_posted: "recapUpdates",
  swing_analysis_ready: "swingAnalysis",
  new_feature_available: "featureAnnouncements",
  feedback_received: "feedbackUpdates",
  submission_received: "submissionUpdates",
  badge_earned: "badgeUpdates",
  practice_plan_shared: "practicePlanUpdates",
  welcome: "systemUpdates",
  system: "systemUpdates",
};

// ─── Email Subject Lines ─────────────────────────────────────────────────────

const TYPE_TO_SUBJECT: Record<NotificationType, (title: string) => string> = {
  drill_assigned: (t) => `New Drill Assignment: ${t}`,
  notes_added: (t) => `Session Notes Updated: ${t}`,
  recap_posted: (t) => `New Session Recap: ${t}`,
  swing_analysis_ready: (t) => `Swing Analysis Ready: ${t}`,
  new_feature_available: (t) => `New Feature: ${t}`,
  feedback_received: (t) => `Coach Feedback: ${t}`,
  submission_received: (t) => `New Submission: ${t}`,
  badge_earned: (t) => `Badge Earned: ${t}`,
  practice_plan_shared: (t) => `Practice Plan Shared: ${t}`,
  welcome: () => `Welcome to Coach Steve Baseball!`,
  system: (t) => t,
};

// ─── Email Template ──────────────────────────────────────────────────────────

function generateNotificationEmailHtml(input: {
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  recipientName?: string;
}): string {
  const { type, title, message, linkUrl, recipientName } = input;

  const typeIcons: Record<NotificationType, string> = {
    drill_assigned: "🎯",
    notes_added: "📝",
    recap_posted: "📊",
    swing_analysis_ready: "🎬",
    new_feature_available: "✨",
    feedback_received: "💬",
    submission_received: "📥",
    badge_earned: "🏆",
    practice_plan_shared: "📋",
    welcome: "👋",
    system: "🔔",
  };

  const icon = typeIcons[type] || "🔔";
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
  const ctaText = linkUrl ? getCTAText(type) : null;
  const appUrl = ENV.appUrl || "https://coachstevemobilecoach.manus.space";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #e0e0e0; margin: 0; padding: 0; background-color: #0a0a0a; }
      .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 3px solid #dc2626; }
      .header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; }
      .header .icon { font-size: 36px; margin-bottom: 10px; display: block; }
      .header .brand { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); margin-top: 8px; }
      .content { background: #141414; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #2a2a2a; border-top: none; }
      .content p { color: #b0b0b0; margin: 12px 0; }
      .message-box { background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
      .message-box p { color: #d0d0d0; margin: 0; }
      .cta-button { display: inline-block; background: #dc2626; color: white !important; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 25px 0; font-size: 16px; letter-spacing: 0.5px; }
      .cta-button:hover { background: #b91c1c; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #2a2a2a; font-size: 12px; color: #666; }
      .footer a { color: #dc2626; text-decoration: none; }
      .unsubscribe { font-size: 11px; color: #555; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <span class="icon">${icon}</span>
        <h1>${title}</h1>
        <div class="brand">Coach Steve Baseball</div>
      </div>
      
      <div class="content">
        <p>${greeting}</p>
        
        <div class="message-box">
          <p>${message}</p>
        </div>
        
        ${ctaText && linkUrl ? `
        <div style="text-align: center;">
          <a href="${linkUrl.startsWith("http") ? linkUrl : appUrl + linkUrl}" class="cta-button">${ctaText}</a>
        </div>
        ` : ""}
        
        <p style="margin-top: 30px; color: #888; font-size: 14px;">
          Keep training hard and stay focused. Every rep counts!
        </p>
      </div>
      
      <div class="footer">
        <p>Coach Steve Baseball &mdash; Player Development Platform</p>
        <p class="unsubscribe">
          <a href="${appUrl}/athlete-portal?tab=settings">Manage notification preferences</a>
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function getCTAText(type: NotificationType): string {
  switch (type) {
    case "drill_assigned": return "View Assignment";
    case "notes_added": return "Read Notes";
    case "recap_posted": return "View Recap";
    case "swing_analysis_ready": return "View Analysis";
    case "feedback_received": return "View Feedback";
    case "submission_received": return "Review Submission";
    case "badge_earned": return "View Badge";
    case "practice_plan_shared": return "View Practice Plan";
    case "welcome": return "Get Started";
    default: return "View Details";
  }
}

// ─── Core Engine ─────────────────────────────────────────────────────────────

/**
 * Central entry point: creates a notification record, checks preferences,
 * sends email if allowed, and tracks delivery status.
 */
export async function sendNotification(input: SendNotificationInput): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    // 1. Deduplication check
    if (input.dedupeKey) {
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(eq(notifications.dedupeKey, input.dedupeKey))
        .limit(1);
      if (existing.length > 0) {
        return { success: true, notificationId: existing[0].id, emailSent: false };
      }
    }

    // 2. Look up recipient email if not provided
    let recipientEmail = input.recipientEmail;
    let recipientName: string | undefined;
    if (!recipientEmail) {
      const userRows = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (userRows.length > 0) {
        recipientEmail = userRows[0].email || undefined;
        recipientName = userRows[0].name || undefined;
      }
    }

    // 3. Insert notification record
    const [inserted] = await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      recipientEmail: recipientEmail || null,
      linkUrl: input.linkUrl || null,
      relatedId: input.relatedId || null,
      relatedType: input.relatedType || null,
      emailStatus: input.portalOnly ? "sent" : "pending",
      portalStatus: "unread",
      dedupeKey: input.dedupeKey || null,
      metadata: input.metadata || null,
    });

    const notificationId = inserted.insertId;

    // 4. If portal-only, we're done
    if (input.portalOnly || !recipientEmail) {
      return { success: true, notificationId, emailSent: false };
    }

    // 5. Check user preferences
    const shouldEmail = await checkEmailPreference(db, input.userId, input.type);
    if (!shouldEmail) {
      await db.update(notifications)
        .set({ emailStatus: "sent" }) // Mark as "sent" (preference-skipped)
        .where(eq(notifications.id, notificationId));
      return { success: true, notificationId, emailSent: false };
    }

    // 6. Send email via Resend
    const emailResult = await deliverEmail({
      to: recipientEmail,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl,
      recipientName,
    });

    // 7. Update delivery status
    if (emailResult.success) {
      await db.update(notifications)
        .set({ emailStatus: "sent", sentAt: new Date(), queuedAt: new Date() })
        .where(eq(notifications.id, notificationId));
    } else {
      await db.update(notifications)
        .set({
          emailStatus: "failed",
          failedAt: new Date(),
          lastError: emailResult.error || "Unknown error",
          retryCount: 1,
        })
        .where(eq(notifications.id, notificationId));
    }

    return {
      success: true,
      notificationId,
      emailSent: emailResult.success,
    };
  } catch (error) {
    console.error("[NotificationEngine] Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Preference Check ────────────────────────────────────────────────────────

async function checkEmailPreference(db: any, userId: number, type: NotificationType): Promise<boolean> {
  try {
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    // No preferences set = default to all on
    if (prefs.length === 0) return true;

    const pref = prefs[0];

    // Master toggle off = no emails
    if (pref.emailNotifications === 0) return false;

    // Check per-type toggle
    const prefKey = TYPE_TO_PREFERENCE[type];
    if (prefKey && prefKey in pref) {
      return (pref as any)[prefKey] === 1;
    }

    return true;
  } catch {
    // On error, default to sending
    return true;
  }
}

// ─── Email Delivery ──────────────────────────────────────────────────────────

async function deliverEmail(input: {
  to: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  recipientName?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    return { success: false, error: "Resend API key not configured" };
  }

  try {
    const html = generateNotificationEmailHtml({
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl,
      recipientName: input.recipientName,
    });

    const subject = TYPE_TO_SUBJECT[input.type](input.title);

    const result = await getResend().emails.send({
      from: ENV.resendFromEmail,
      ...(ENV.resendReplyTo ? { replyTo: ENV.resendReplyTo } : {}),
      to: input.to,
      subject,
      html,
    });

    if (result.error) {
      console.error("[NotificationEngine] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[NotificationEngine] Email sent to ${input.to} (type: ${input.type})`);
    return { success: true };
  } catch (error) {
    console.error("[NotificationEngine] Email delivery error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Retry Failed Emails ─────────────────────────────────────────────────────

const MAX_RETRIES = 3;

/**
 * Process failed notifications and retry email delivery.
 * Call this on a schedule (e.g., every 5 minutes).
 */
export async function retryFailedNotifications(): Promise<{ retried: number; succeeded: number }> {
  const db = await getDb();
  if (!db) return { retried: 0, succeeded: 0 };

  try {
    // Find failed notifications with retryCount < MAX_RETRIES
    const failed = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.emailStatus, "failed"),
          lt(notifications.retryCount, MAX_RETRIES)
        )
      )
      .limit(50);

    let succeeded = 0;

    for (const notif of failed) {
      if (!notif.recipientEmail) continue;

      // Look up recipient name
      let recipientName: string | undefined;
      const userRows = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, notif.userId))
        .limit(1);
      if (userRows.length > 0) {
        recipientName = userRows[0].name || undefined;
      }

      const result = await deliverEmail({
        to: notif.recipientEmail,
        type: notif.type as NotificationType,
        title: notif.title,
        message: notif.message,
        linkUrl: notif.linkUrl || undefined,
        recipientName,
      });

      if (result.success) {
        await db.update(notifications)
          .set({ emailStatus: "sent", sentAt: new Date(), lastError: null })
          .where(eq(notifications.id, notif.id));
        succeeded++;
      } else {
        await db.update(notifications)
          .set({
            retryCount: notif.retryCount + 1,
            lastError: result.error || "Retry failed",
            failedAt: new Date(),
          })
          .where(eq(notifications.id, notif.id));
      }
    }

    if (failed.length > 0) {
      console.log(`[NotificationEngine] Retried ${failed.length} failed notifications, ${succeeded} succeeded`);
    }

    return { retried: failed.length, succeeded };
  } catch (error) {
    console.error("[NotificationEngine] Retry error:", error);
    return { retried: 0, succeeded: 0 };
  }
}

// ─── Batch Send (for announcements) ─────────────────────────────────────────

/**
 * Send the same notification to multiple users at once.
 */
export async function sendBulkNotification(
  userIds: number[],
  input: Omit<SendNotificationInput, "userId">
): Promise<{ total: number; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendNotification({ ...input, userId });
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { total: userIds.length, sent, failed };
}

// ─── Mark All Read ───────────────────────────────────────────────────────────

export async function markAllNotificationsRead(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(notifications)
      .set({ portalStatus: "read", readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.portalStatus, "unread")
        )
      );
    return true;
  } catch (error) {
    console.error("[NotificationEngine] Error marking all as read:", error);
    return false;
  }
}
