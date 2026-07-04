/**
 * Direct email send test — bypasses tRPC auth, calls Resend SDK directly
 * using the same ENV values the server uses.
 * Run: node scripts/test-email-send.mjs
 */
import { config } from "dotenv";
config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Unescape unicode sequences that the platform's secret storage may inject
const FROM_EMAIL = (process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev")
  .replace(/\\u003c/gi, "<")
  .replace(/\\u003e/gi, ">");
const REPLY_TO = process.env.RESEND_REPLY_TO || "";
const TO_EMAIL = "coachstevengoldstein@gmail.com";

if (!RESEND_API_KEY) {
  console.error("ERROR: RESEND_API_KEY is not set");
  process.exit(1);
}

console.log("=== Email Send Verification ===");
console.log(`From:     ${FROM_EMAIL}`);
console.log(`Reply-To: ${REPLY_TO || "(not set)"}`);
console.log(`To:       ${TO_EMAIL}`);
console.log("");

// Build the exact payload the server sends
const payload = {
  from: FROM_EMAIL,
  to: TO_EMAIL,
  subject: "✅ Coach Steve App — Reply-To Verification Test",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #C9A84C;">Email Header Verification</h2>
      <p>This is a live test email sent to verify the Reply-To header is correctly set.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">From</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${FROM_EMAIL}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Reply-To</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${REPLY_TO || "(not set)"}</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">To</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${TO_EMAIL}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 14px;">
        To verify Reply-To: hit "Reply" in your email client — it should pre-fill 
        <strong>${REPLY_TO}</strong> as the recipient.
      </p>
    </div>
  `,
};

// Add replyTo only if set (mirrors the server logic exactly)
if (REPLY_TO) {
  payload.replyTo = REPLY_TO;
}

console.log("Payload being sent to Resend API:");
console.log(JSON.stringify({ ...payload, html: "[html omitted]" }, null, 2));
console.log("");

// Call Resend REST API directly so we can capture the raw response
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const responseBody = await response.json();

console.log("=== Resend API Response ===");
console.log(`HTTP Status: ${response.status} ${response.statusText}`);
console.log("Response body:", JSON.stringify(responseBody, null, 2));
console.log("");

if (response.ok && responseBody.id) {
  console.log("✅ SUCCESS");
  console.log(`   Message ID: ${responseBody.id}`);
  console.log(`   From:       ${FROM_EMAIL}`);
  console.log(`   Reply-To:   ${REPLY_TO}`);
  console.log(`   To:         ${TO_EMAIL}`);
  console.log("");
  console.log("To verify Reply-To in the received email:");
  console.log("  1. Open the email in coachstevengoldstein@gmail.com");
  console.log("  2. Click Reply — the To field should show coachstevengoldstein@gmail.com");
  console.log("  3. View raw headers: Reply-To: coachstevengoldstein@gmail.com");
} else {
  console.error("❌ FAILED");
  console.error("Error:", responseBody);
}
