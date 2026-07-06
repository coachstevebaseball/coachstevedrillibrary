import * as dotenv from "dotenv";
dotenv.config();

const raw = process.env.RESEND_FROM_EMAIL || "(not set)";
// Apply the same unescape logic as env.ts
const fromEmail = raw.replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">");
console.log("Raw RESEND_FROM_EMAIL:", JSON.stringify(raw));
console.log("Unescaped from email:", JSON.stringify(fromEmail));
console.log("COACH_ALERT_EMAIL:", JSON.stringify(process.env.COACH_ALERT_EMAIL || "(not set)"));
console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
