import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if user already exists BEFORE upserting
      const existingUserBefore = await db.getUserByOpenId(userInfo.openId);
      // Also check by email in case openId changed
      let isNewUser = !existingUserBefore;
      if (isNewUser && userInfo.email) {
        const emailMatch = await db.getUserByEmail(userInfo.email);
        if (emailMatch) {
          isNewUser = false;
        }
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // If this is a brand-new user, notify Coach Steve
      if (isNewUser) {
        notifyCoachOfNewUser(
          userInfo.name || "Unknown",
          userInfo.email || "No email provided"
        ).catch((err) =>
          console.error("[OAuth] Failed to notify coach of new user:", err)
        );
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Parse the state to extract the post-login redirect destination
      let returnTo = "/";
      try {
        const decoded = Buffer.from(state, "base64").toString("utf-8");
        // Try parsing as JSON (new format with returnTo)
        const parsed = JSON.parse(decoded);
        if (parsed.returnTo && typeof parsed.returnTo === "string" && parsed.returnTo.startsWith("/")) {
          returnTo = parsed.returnTo;
        }
      } catch {
        // Old format or invalid state — fall back to homepage
      }

      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

/**
 * Send Coach Steve an email notification when a new user registers.
 * This runs asynchronously and does not block the OAuth callback.
 */
async function notifyCoachOfNewUser(name: string, email: string): Promise<void> {
  try {
    const { sendNotification } = await import("../notificationEngine");
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const database = await getDb();
    if (!database) return;

    // Find Coach Steve (admin user)
    const admins = await database
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (admins.length === 0) {
      console.warn("[OAuth] No admin user found to notify about new registration");
      return;
    }

    const admin = admins[0];

    await sendNotification({
      userId: admin.id,
      type: "system",
      title: "New User Registration",
      message: `A new user just signed up:\n\nName: ${name}\nEmail: ${email}\n\nThey have been assigned the "user" role. If this is one of your athletes, you can update their role to "athlete" in the Admin Dashboard.`,
      recipientEmail: admin.email || undefined,
      linkUrl: "/admin",
    });

    console.log(`[OAuth] Coach notified of new user: ${name} (${email})`);
  } catch (err) {
    console.error("[OAuth] Error notifying coach of new user:", err);
  }
}
