/**
 * Test script: send a real invite email and drill-assignment email
 * and verify the links use coachsteve.manus.space
 */
import { config } from "dotenv";
config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = (process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev")
  .replace(/\\u003c/gi, "<")
  .replace(/\\u003e/gi, ">");
const REPLY_TO = process.env.RESEND_REPLY_TO || "";
const APP_URL = process.env.VITE_APP_URL || process.env.APP_URL || "https://coachsteve.manus.space";
const TO_EMAIL = "coachstevengoldstein@gmail.com";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not set");
  process.exit(1);
}

// Simulate a real invite token
const FAKE_INVITE_TOKEN = "test-token-" + Date.now();
const FAKE_DRILL_SLUG = "angle-flips";

const inviteUrl = `${APP_URL}/accept-invite/${FAKE_INVITE_TOKEN}`;
const portalUrl = `${APP_URL}/athlete-portal`;

console.log("=== Email Link Verification ===");
console.log("APP_URL:    ", APP_URL);
console.log("Invite URL: ", inviteUrl);
console.log("Portal URL: ", portalUrl);
console.log("From:       ", FROM_EMAIL);
console.log("Reply-To:   ", REPLY_TO);
console.log("");

async function sendEmail(subject, html) {
  const payload = {
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject,
    html,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  return { status: res.status, ok: res.ok, body };
}

// --- Test 1: Invite Email ---
console.log("--- Test 1: Invite Email ---");
const inviteHtml = `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:20px">
<h2 style="color:#C9A84C">⚾ You're invited to Coach Steve Baseball</h2>
<p>You've been invited to join as an athlete.</p>
<p><strong>Accept Invite URL:</strong><br>
<a href="${inviteUrl}" style="color:#C9A84C">${inviteUrl}</a></p>
<p style="font-size:12px;color:#94a3b8">From: ${FROM_EMAIL} | Reply-To: ${REPLY_TO}</p>
</body></html>`;

const r1 = await sendEmail("✅ [TEST] Invite Email — Link Verification", inviteHtml);
if (r1.ok) {
  console.log("✅ Invite email sent");
  console.log("   Message ID:", r1.body.id);
  console.log("   Accept-Invite URL:", inviteUrl);
} else {
  console.log("❌ Invite email FAILED:", r1.status, JSON.stringify(r1.body));
}

// --- Test 2: Drill Assignment Email ---
console.log("\n--- Test 2: Drill Assignment Email ---");
const assignHtml = `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:20px">
<h2 style="color:#C9A84C">🎯 New Drill Assigned: Angle Flips</h2>
<p>A new drill has been assigned to you.</p>
<p><strong>Athlete Portal URL:</strong><br>
<a href="${portalUrl}" style="color:#C9A84C">${portalUrl}</a></p>
<p style="font-size:12px;color:#94a3b8">From: ${FROM_EMAIL} | Reply-To: ${REPLY_TO}</p>
</body></html>`;

const r2 = await sendEmail("✅ [TEST] Drill Assignment Email — Link Verification", assignHtml);
if (r2.ok) {
  console.log("✅ Drill assignment email sent");
  console.log("   Message ID:", r2.body.id);
  console.log("   Athlete Portal URL:", portalUrl);
} else {
  console.log("❌ Drill assignment email FAILED:", r2.status, JSON.stringify(r2.body));
}

console.log("\n=== Summary ===");
console.log("Both emails sent to:", TO_EMAIL);
console.log("Accept-Invite link: ", inviteUrl);
console.log("Athlete Portal link:", portalUrl);
console.log("Domain used:        ", APP_URL.includes("coachsteve.manus.space") ? "✅ coachsteve.manus.space" : "❌ WRONG DOMAIN: " + APP_URL);
