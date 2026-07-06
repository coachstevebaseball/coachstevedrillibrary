/**
 * Live test script for coach activity alert emails.
 * Sends all three alert types to coachstevengoldstein@gmail.com.
 * Run with: node scripts/test-coach-alerts.mjs
 */
import { Resend } from "resend";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = (process.env.RESEND_FROM_EMAIL || "CoachSteve <coach@longislandhittingcoach.com>")
  .replace(/\\u003c/gi, "<")
  .replace(/\\u003e/gi, ">");
const TO_EMAIL = process.env.COACH_ALERT_EMAIL || "coachstevengoldstein@gmail.com";
const APP_URL = process.env.VITE_APP_URL || "https://coachsteve.manus.space";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

const alerts = [
  {
    type: "portal_login",
    subject: "🔔 Test Athlete just logged in",
    icon: "👋",
    color: "#3b82f6",
    message: "Test Athlete just logged into their portal",
    label: "Athlete Activity Alert",
  },
  {
    type: "drill_view",
    subject: "🔔 Test Athlete viewed a drill",
    icon: "👁️",
    color: "#8b5cf6",
    message: "Test Athlete viewed the drill: Tee Work - Hip Rotation",
    label: "Athlete Activity Alert",
  },
  {
    type: "drill_complete",
    subject: "✅ Test Athlete completed a drill",
    icon: "✅",
    color: "#10b981",
    message: "Test Athlete completed the drill: Tee Work - Hip Rotation",
    label: "Drill Completed",
  },
];

const now = new Date().toLocaleString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/New_York",
}) + " EST";

for (const alert of alerts) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${alert.color}; color: white; padding: 25px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 32px; margin-bottom: 10px; }
    .content { background: #f9fafb; padding: 25px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    .activity-card { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${alert.color}; }
    .athlete-name { font-size: 18px; font-weight: bold; color: #1e3a8a; }
    .activity-message { color: #4b5563; font-size: 16px; margin: 10px 0; }
    .timestamp { color: #9ca3af; font-size: 13px; }
    .cta-button { display: inline-block; background: ${alert.color}; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 15px 0; }
    .footer { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    .test-banner { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${alert.icon}</div>
      <h1>${alert.label}</h1>
    </div>
    <div class="content">
      <div class="test-banner">⚠️ This is a live test email sent at ${now} to verify delivery to ${TO_EMAIL}</div>
      <p>Hi Coach Steve,</p>
      <div class="activity-card">
        <div class="athlete-name">Test Athlete</div>
        <div class="activity-message">${alert.message}</div>
        <div class="timestamp">📅 ${now}</div>
      </div>
      <div style="text-align: center;">
        <a href="${APP_URL}/coach-dashboard/activity-feed" class="cta-button">View Activity Feed</a>
      </div>
      <div class="footer">
        <p>Alert type: <strong>${alert.type}</strong> | Sent to: <strong>${TO_EMAIL}</strong></p>
        <p>From: ${FROM_EMAIL}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `[TEST] ${alert.subject}`,
      html,
    });

    if (result.error) {
      console.error(`❌ Failed to send ${alert.type}:`, result.error);
    } else {
      console.log(`✅ ${alert.type} → to: ${TO_EMAIL} | Resend ID: ${result.data?.id}`);
    }
  } catch (err) {
    console.error(`❌ Error sending ${alert.type}:`, err.message);
  }
}

console.log("\nDone. Check your inbox at:", TO_EMAIL);
