/**
 * POST /api/webhooks/resend
 *
 * Public endpoint — no auth cookie required (Resend can't send one).
 * Verifies the svix signature, persists every event to emailEvents,
 * and updates user/notification state for all 8 Resend event types.
 *
 * Returns:
 *   200 — event accepted and processed
 *   400 — malformed payload (missing required fields)
 *   401 — invalid or replayed signature
 */

import type { Request, Response } from "express";
import { Webhook } from "svix";
import { getDb } from "../db";
import {
  emailEvents,
  emailNotificationLog,
  users,
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { ENV } from "../_core/env";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResendWebhookPayload {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    created_at?: string;
    [key: string]: unknown;
  };
}

// ── Singleton tracking for health check ───────────────────────────────────────

let lastWebhookReceivedAt: string | null = null;

export function getLastWebhookReceivedAt(): string | null {
  return lastWebhookReceivedAt;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handleResendWebhook(req: Request, res: Response): Promise<void> {
  // 1. Signature verification via svix
  const secret = ENV.resendWebhookSecret;
  if (!secret) {
    // If no secret is configured, reject all requests with 401 so misconfiguration
    // is immediately visible rather than silently accepting unsigned events.
    res.status(401).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string | undefined;
  const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
  const svixSignature = req.headers["svix-signature"] as string | undefined;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(401).json({ error: "Missing svix headers" });
    return;
  }

  // Replay protection: reject events older than 5 minutes
  const tsSeconds = parseInt(svixTimestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (isNaN(tsSeconds) || Math.abs(nowSeconds - tsSeconds) > 300) {
    res.status(401).json({ error: "Request timestamp too old or invalid" });
    return;
  }

  // Verify HMAC using the official svix library
  let payload: ResendWebhookPayload;
  try {
    const wh = new Webhook(secret);
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody
      ? (req as Request & { rawBody?: Buffer }).rawBody!.toString("utf8")
      : JSON.stringify(req.body);

    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendWebhookPayload;
  } catch {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  // 2. Basic payload validation
  if (!payload?.type || !payload?.data) {
    res.status(400).json({ error: "Malformed payload: missing type or data" });
    return;
  }

  const emailId = payload.data.email_id ?? "";
  const recipient = Array.isArray(payload.data.to) ? payload.data.to[0] ?? "" : "";

  if (!emailId || !recipient) {
    res.status(400).json({ error: "Malformed payload: missing email_id or to" });
    return;
  }

  // 3. Update last-received timestamp for health check
  lastWebhookReceivedAt = new Date().toISOString();

  // 4. Persist to emailEvents (idempotency via unique svixId constraint)
  const db = await getDb();
  if (!db) {
    // Accept and log but don't crash Resend's retry loop
    console.error("[ResendWebhook] Database unavailable — event not persisted");
    res.status(200).json({ ok: true, warning: "db_unavailable" });
    return;
  }

  try {
    await db.insert(emailEvents).values({
      emailId,
      svixId,
      eventType: payload.type,
      recipient,
      payloadJson: payload as unknown as Record<string, unknown>,
    });
  } catch (err: unknown) {
    const mysqlErr = err as { code?: string };
    if (mysqlErr?.code === "ER_DUP_ENTRY") {
      // Idempotency: same svix-id already processed — return 200 silently
      res.status(200).json({ ok: true, idempotent: true });
      return;
    }
    console.error("[ResendWebhook] Failed to insert emailEvent:", err);
    // Still return 200 so Resend doesn't retry infinitely
    res.status(200).json({ ok: true, warning: "insert_failed" });
    return;
  }

  // 5. Handle each event type
  try {
    await dispatchEvent(db, payload, emailId, recipient);
  } catch (err) {
    console.error("[ResendWebhook] dispatchEvent error:", err);
    // Don't let handler errors cause Resend retries
  }

  res.status(200).json({ ok: true });
}

// ── Event dispatcher ──────────────────────────────────────────────────────────

async function dispatchEvent(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  payload: ResendWebhookPayload,
  emailId: string,
  recipient: string
): Promise<void> {
  switch (payload.type) {
    case "email.sent":
      // Log only — already persisted to emailEvents above
      console.log(`[ResendWebhook] email.sent: ${emailId} → ${recipient}`);
      break;

    case "email.delivered":
      await db
        .update(emailNotificationLog)
        .set({ deliveredAt: new Date() })
        .where(eq(emailNotificationLog.resendId, emailId));
      console.log(`[ResendWebhook] email.delivered: ${emailId} → ${recipient}`);
      break;

    case "email.delivery_delayed":
      // Log only
      console.warn(`[ResendWebhook] email.delivery_delayed: ${emailId} → ${recipient}`);
      break;

    case "email.bounced":
      await flagUserBounced(db, recipient, "bounced");
      console.warn(`[ResendWebhook] email.bounced: ${emailId} → ${recipient} — user flagged`);
      break;

    case "email.complained":
      await flagUserComplained(db, recipient);
      console.warn(`[ResendWebhook] email.complained: ${emailId} → ${recipient} — user flagged`);
      break;

    case "email.opened":
      await db
        .update(emailNotificationLog)
        .set({ openedAt: new Date() })
        .where(
          and(
            eq(emailNotificationLog.resendId, emailId),
            sql`${emailNotificationLog.openedAt} IS NULL`
          )
        );
      console.log(`[ResendWebhook] email.opened: ${emailId} → ${recipient}`);
      break;

    case "email.clicked":
      await db
        .update(emailNotificationLog)
        .set({ clickedAt: new Date() })
        .where(
          and(
            eq(emailNotificationLog.resendId, emailId),
            sql`${emailNotificationLog.clickedAt} IS NULL`
          )
        );
      console.log(`[ResendWebhook] email.clicked: ${emailId} → ${recipient}`);
      break;

    case "email.failed":
      await handleEmailFailed(db, recipient);
      console.error(`[ResendWebhook] email.failed: ${emailId} → ${recipient}`);
      break;

    default:
      console.log(`[ResendWebhook] Unknown event type: ${payload.type}`);
  }
}

// ── State mutation helpers ────────────────────────────────────────────────────

async function flagUserBounced(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  email: string,
  _reason: "bounced" | "failure_threshold"
): Promise<void> {
  await db
    .update(users)
    .set({ emailBounced: true })
    .where(eq(users.email, email));
}

async function flagUserComplained(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  email: string
): Promise<void> {
  await db
    .update(users)
    .set({ emailComplained: true })
    .where(eq(users.email, email));
}

async function handleEmailFailed(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  email: string
): Promise<void> {
  // Increment failure count; auto-bounce at threshold of 3
  const [row] = await db
    .select({ emailFailureCount: users.emailFailureCount })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!row) return; // Unknown recipient — nothing to update

  const newCount = (row.emailFailureCount ?? 0) + 1;
  const shouldBounce = newCount >= 3;

  await db
    .update(users)
    .set({
      emailFailureCount: newCount,
      ...(shouldBounce ? { emailBounced: true } : {}),
    })
    .where(eq(users.email, email));
}
