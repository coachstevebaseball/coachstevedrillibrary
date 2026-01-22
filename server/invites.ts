import { getDb } from "./db";
import { invites } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import crypto from "crypto";
import { sendInviteEmail } from "./email";

/**
 * Generate a unique invite token
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new invite
 */
export async function createInvite(
  email: string,
  createdByUserId: number,
  role: "user" | "admin" | "athlete" | "coach" = "athlete",
  expirationDays: number = 7,
  sendEmail: boolean = true
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const inviteToken = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  await db.insert(invites).values({
    email,
    inviteToken,
    role,
    status: "pending",
    expiresAt,
    createdByUserId,
  });

  const inviteUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/accept-invite/${inviteToken}`;

  // Send invite email if enabled
  if (sendEmail) {
    const inviteType = role === "coach" ? "coach" : "athlete";
    await sendInviteEmail({
      toEmail: email,
      inviteLink: inviteUrl,
      inviteType,
      expiresAt,
    });
  }

  return {
    email,
    inviteToken,
    expiresAt,
    inviteUrl,
  };
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const invite = await db
    .select()
    .from(invites)
    .where(eq(invites.inviteToken, token))
    .limit(1);

  return invite[0] || null;
}

/**
 * Check if invite is valid (not expired, not already accepted)
 */
export function isInviteValid(invite: any): boolean {
  if (!invite) return false;
  if (invite.status !== "pending") return false;
  if (new Date(invite.expiresAt) < new Date()) return false;
  return true;
}

/**
 * Accept an invite and create user account
 */
export async function acceptInvite(
  token: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const invite = await getInviteByToken(token);

  if (!invite || !isInviteValid(invite)) {
    throw new Error("Invalid or expired invite");
  }

  // Import users table for role update
  const { users } = await import("../drizzle/schema");

  // Update user role based on invite role and set as active if athlete
  const updateData: any = { role: invite.role };
  if (invite.role === "athlete") {
    updateData.isActiveClient = 1;
  }
  
  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  // Update invite status
  await db
    .update(invites)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
      acceptedByUserId: userId,
    })
    .where(eq(invites.inviteToken, token));

  return invite;
}

/**
 * Get all invites (admin only)
 */
export async function getAllInvites() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(invites).orderBy(invites.createdAt);
}

/**
 * Get pending invites
 */
export async function getPendingInvites() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(invites)
    .where(eq(invites.status, "pending"));
}

/**
 * Resend invite (generate new token, mark old as expired)
 */
export async function resendInvite(inviteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const invite = await db
    .select()
    .from(invites)
    .where(eq(invites.id, inviteId))
    .limit(1);

  if (!invite[0]) {
    throw new Error("Invite not found");
  }

  const oldInvite = invite[0];

  // Mark old invite as expired
  await db
    .update(invites)
    .set({ status: "expired" })
    .where(eq(invites.id, inviteId));

  // Create new invite
  return await createInvite(
    oldInvite.email,
    oldInvite.createdByUserId,
    oldInvite.role as any
  );
}

/**
 * Revoke invite
 */
export async function revokeInvite(inviteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(invites)
    .set({ status: "expired" })
    .where(eq(invites.id, inviteId));
}

/**
 * Expire old pending invites (called periodically)
 */
export async function expireOldInvites() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  await db
    .update(invites)
    .set({ status: "expired" })
    .where(
      and(
        eq(invites.status, "pending"),
        lt(invites.expiresAt, now)
      )
    );
}
