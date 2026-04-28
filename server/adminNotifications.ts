/**
 * Admin Notification Triggers
 *
 * Sends email notifications to Coach Steve (admin) via Resend when:
 * 1. An athlete accepts an invite
 * 2. An athlete logs in for the first time
 * 3. An athlete marks a drill complete
 * 4. An athlete leaves a note on an assignment
 *
 * All emails are sent via the centralized notificationEngine and
 * message IDs are logged in the emailNotificationLog table.
 */

import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendNotification } from "./notificationEngine";

/**
 * Find the admin user (Coach Steve) to send notifications to.
 */
async function getAdminUser() {
  const db = await getDb();
  if (!db) return null;

  const admins = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  return admins.length > 0 ? admins[0] : null;
}

/**
 * 1. Athlete accepts an invite → email admin
 */
export async function notifyAdminInviteAccepted(
  athleteName: string,
  athleteEmail: string
): Promise<void> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("[AdminNotify] No admin user found");
      return;
    }

    const result = await sendNotification({
      userId: admin.id,
      type: "system",
      title: "Athlete Accepted Invite",
      message: `${athleteName} (${athleteEmail}) just accepted their invite and activated their account. They are now an active athlete on the platform.`,
      recipientEmail: admin.email || undefined,
      linkUrl: "/coach-dashboard",
      dedupeKey: `invite-accepted-${athleteEmail}-${Date.now()}`,
    });

    console.log(
      `[AdminNotify] Invite accepted notification sent for ${athleteName}: notificationId=${result.notificationId}, emailSent=${result.emailSent}`
    );
  } catch (err) {
    console.error("[AdminNotify] Failed to notify admin of invite acceptance:", err);
  }
}

/**
 * 2. Athlete logs in for the first time → email admin
 */
export async function notifyAdminFirstLogin(
  athleteName: string,
  athleteEmail: string
): Promise<void> {
  try {
    const admin = await getAdminUser();
    if (!admin) return;

    const result = await sendNotification({
      userId: admin.id,
      type: "system",
      title: "Athlete First Login",
      message: `${athleteName} (${athleteEmail}) logged in for the first time. They can now access their drills and training portal.`,
      recipientEmail: admin.email || undefined,
      linkUrl: "/coach-dashboard",
      dedupeKey: `first-login-${athleteEmail}`,
    });

    console.log(
      `[AdminNotify] First login notification sent for ${athleteName}: notificationId=${result.notificationId}, emailSent=${result.emailSent}`
    );
  } catch (err) {
    console.error("[AdminNotify] Failed to notify admin of first login:", err);
  }
}

/**
 * 3. Athlete marks a drill complete → email admin
 */
export async function notifyAdminDrillComplete(
  athleteName: string,
  athleteEmail: string,
  drillName: string
): Promise<void> {
  try {
    const admin = await getAdminUser();
    if (!admin) return;

    const result = await sendNotification({
      userId: admin.id,
      type: "system",
      title: "Drill Completed",
      message: `${athleteName} (${athleteEmail}) just marked "${drillName}" as complete.`,
      recipientEmail: admin.email || undefined,
      linkUrl: "/coach-dashboard",
    });

    console.log(
      `[AdminNotify] Drill complete notification sent for ${athleteName} → ${drillName}: notificationId=${result.notificationId}, emailSent=${result.emailSent}`
    );
  } catch (err) {
    console.error("[AdminNotify] Failed to notify admin of drill completion:", err);
  }
}

/**
 * 4. Athlete leaves a note on an assignment → email admin
 */
export async function notifyAdminNoteLeft(
  athleteName: string,
  athleteEmail: string,
  drillName: string,
  notePreview: string
): Promise<void> {
  try {
    const admin = await getAdminUser();
    if (!admin) return;

    const preview = notePreview.length > 200 ? notePreview.slice(0, 200) + "…" : notePreview;

    const result = await sendNotification({
      userId: admin.id,
      type: "system",
      title: "Athlete Left a Note",
      message: `${athleteName} (${athleteEmail}) left a note on "${drillName}":\n\n"${preview}"`,
      recipientEmail: admin.email || undefined,
      linkUrl: "/coach-dashboard",
    });

    console.log(
      `[AdminNotify] Note notification sent for ${athleteName} → ${drillName}: notificationId=${result.notificationId}, emailSent=${result.emailSent}`
    );
  } catch (err) {
    console.error("[AdminNotify] Failed to notify admin of athlete note:", err);
  }
}
