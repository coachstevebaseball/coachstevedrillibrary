import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
for (const p of ["/home/ubuntu/usab-drills-directory/.env", resolve(here, "..", ".env")]) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const findings = [];
const add = (severity, area, msg) => findings.push({ severity, area, msg });

async function q(sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}
async function one(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] ?? null;
}

console.log("\n=== DB HEALTH AUDIT (read-only) ===\n");

// --- 1. USERS ---
console.log("--- USERS ---");
const userTotal = (await one("SELECT COUNT(*) AS c FROM users")).c;
const adminCount = (await one("SELECT COUNT(*) AS c FROM users WHERE role='admin'")).c;
const athleteCount = (await one("SELECT COUNT(*) AS c FROM users WHERE role='athlete'")).c;
const noEmail = (await one("SELECT COUNT(*) AS c FROM users WHERE email IS NULL OR email=''")).c;
const dupEmail = (await one("SELECT COUNT(*) AS c FROM (SELECT email, COUNT(*) n FROM users WHERE email IS NOT NULL GROUP BY email HAVING n>1) d")).c;
const emailBounced = (await one("SELECT COUNT(*) AS c FROM users WHERE emailBounced=TRUE")).c;
const emailComplained = (await one("SELECT COUNT(*) AS c FROM users WHERE emailComplained=TRUE")).c;
const failingEmail = (await one("SELECT COUNT(*) AS c FROM users WHERE emailFailureCount >= 3")).c;
const unverified = (await one("SELECT COUNT(*) AS c FROM users WHERE emailVerified=0")).c;
const placeholder = (await one("SELECT COUNT(*) AS c FROM users WHERE openId='deleted-athletes-placeholder'")).c;
console.table({ total: userTotal, admin: adminCount, athlete: athleteCount, noEmail, dupEmail, emailBounced, emailComplained, failingEmail, unverified, placeholder });

if (dupEmail > 0) add("HIGH", "users", `${dupEmail} duplicate email addresses across user rows`);
if (noEmail > 0) add("MED", "users", `${noEmail} users have no email (can't receive notifications)`);
if (emailBounced > 0) add("MED", "email", `${emailBounced} users flagged as hard-bounced`);
if (failingEmail > 0) add("MED", "email", `${failingEmail} users have 3+ consecutive email failures`);

// --- 2. ASSIGNMENTS ---
console.log("\n--- DRILL ASSIGNMENTS ---");
const aTotal = (await one("SELECT COUNT(*) AS c FROM drillAssignments")).c;
const aOrphans = (await one(`SELECT COUNT(*) AS c FROM drillAssignments WHERE userId IS NOT NULL AND userId NOT IN (SELECT id FROM users)`)).c;
const aStaleInProg = (await one(`SELECT COUNT(*) AS c FROM drillAssignments WHERE status='in-progress' AND assignedAt < (NOW() - INTERVAL 30 DAY)`)).c;
const aOldAssigned = (await one(`SELECT COUNT(*) AS c FROM drillAssignments WHERE status='assigned' AND assignedAt < (NOW() - INTERVAL 60 DAY)`)).c;
const aNoName = (await one(`SELECT COUNT(*) AS c FROM drillAssignments WHERE athleteName IS NULL AND userId IS NOT NULL`)).c;
const aOverdue = (await one(`SELECT COUNT(*) AS c FROM drillAssignments WHERE status<>'completed' AND dueDate IS NOT NULL AND dueDate < NOW()`)).c;
console.table({ total: aTotal, orphans: aOrphans, staleInProgress30d: aStaleInProg, oldAssigned60d: aOldAssigned, missingNames: aNoName, overdue: aOverdue });

if (aOrphans > 0) add("HIGH", "assignments", `${aOrphans} orphan drillAssignments (userId not in users) — cleanup script regressed`);
if (aNoName > 0) add("LOW", "assignments", `${aNoName} assignments have NULL athleteName despite having userId`);
if (aStaleInProg > 0) add("LOW", "assignments", `${aStaleInProg} assignments stuck "in-progress" > 30 days`);

// --- 3. NOTIFICATIONS ---
console.log("\n--- NOTIFICATIONS ---");
try {
  const nTotal = (await one("SELECT COUNT(*) AS c FROM notifications")).c;
  const nUnread = (await one("SELECT COUNT(*) AS c FROM notifications WHERE readAt IS NULL")).c;
  const nUnreadOld = (await one("SELECT COUNT(*) AS c FROM notifications WHERE readAt IS NULL AND createdAt < (NOW() - INTERVAL 30 DAY)")).c;
  const nOrphanUsers = (await one("SELECT COUNT(*) AS c FROM notifications WHERE userId NOT IN (SELECT id FROM users)")).c;
  console.table({ total: nTotal, unread: nUnread, unreadOlderThan30d: nUnreadOld, orphanUserRefs: nOrphanUsers });
  if (nUnreadOld > 100) add("HIGH", "notifications", `${nUnreadOld} notifications unread for >30 days — backlog growing`);
  if (nUnread > 1000) add("MED", "notifications", `${nUnread} total unread notifications`);
  if (nOrphanUsers > 0) add("MED", "notifications", `${nOrphanUsers} notifications reference deleted users`);

  const byType = await q("SELECT type, COUNT(*) AS c, SUM(readAt IS NULL) AS unread FROM notifications GROUP BY type ORDER BY c DESC");
  console.log("By type:"); console.table(byType);
} catch (e) { console.log("notifications: " + e.message); }

// --- 4. EMAIL ---
console.log("\n--- EMAIL INFRASTRUCTURE ---");
try {
  const peTotal = (await one("SELECT COUNT(*) AS c FROM pendingEmailAlerts")).c;
  const pePending = (await one("SELECT COUNT(*) AS c FROM pendingEmailAlerts WHERE isSent=0")).c;
  const peOverdue = (await one("SELECT COUNT(*) AS c FROM pendingEmailAlerts WHERE isSent=0 AND scheduledSendAt < NOW()")).c;
  console.table({ pendingEmailAlerts_total: peTotal, pending: pePending, overdue: peOverdue });
  if (peOverdue > 0) add("HIGH", "email", `${peOverdue} email alerts past their scheduledSendAt but isSent=0 (queue not draining)`);
} catch (e) { console.log("pendingEmailAlerts: " + e.message); }

try {
  const eeTotal = (await one("SELECT COUNT(*) AS c FROM emailEvents")).c;
  const eeBounce = (await one(`SELECT COUNT(*) AS c FROM emailEvents WHERE eventType IN ('email.bounced','bounced')`)).c;
  const eeComplaint = (await one(`SELECT COUNT(*) AS c FROM emailEvents WHERE eventType IN ('email.complained','complained')`)).c;
  console.table({ emailEvents_total: eeTotal, bounce: eeBounce, complaint: eeComplaint });
} catch (e) { console.log("emailEvents: " + e.message); }

// --- 5. DRILLS ---
console.log("\n--- DRILLS ---");
const dTotal = (await one("SELECT COUNT(*) AS c FROM drills")).c;
const dVisible = (await one("SELECT COUNT(*) AS c FROM drills WHERE isHidden=FALSE")).c;
const dNoDifficulty = (await one("SELECT COUNT(*) AS c FROM drills WHERE difficulty IS NULL")).c;
const dNoCategories = (await one("SELECT COUNT(*) AS c FROM drills WHERE categories IS NULL OR JSON_LENGTH(categories)=0")).c;
const dcOrphan = (await one("SELECT COUNT(*) AS c FROM drillCustomizations WHERE drillId NOT IN (SELECT drillId FROM drills)")).c;
const dvOrphan = (await one("SELECT COUNT(*) AS c FROM drillVideos WHERE drillId NOT IN (SELECT drillId FROM drills)")).c;
const dfOrphan = (await one("SELECT COUNT(*) AS c FROM drillFavorites WHERE drillId NOT IN (SELECT drillId FROM drills)")).c;
console.table({ total: dTotal, visible: dVisible, noDifficulty: dNoDifficulty, noCategories: dNoCategories });
console.table({ drillCustomizations_orphan: dcOrphan, drillVideos_orphan: dvOrphan, drillFavorites_orphan: dfOrphan });
if (dcOrphan > 0) add("MED", "drills", `${dcOrphan} drillCustomizations point to drillId not in drills`);
if (dvOrphan > 0) add("MED", "drills", `${dvOrphan} drillVideos point to drillId not in drills`);
if (dfOrphan > 0) add("MED", "drills", `${dfOrphan} drillFavorites point to drillId not in drills`);
if (dNoDifficulty > 50) add("LOW", "drills", `${dNoDifficulty} drills have NULL difficulty`);

// --- 6. DUPLICATE TABLES SUSPECT ---
console.log("\n--- DUPLICATE/SUSPECT TABLES ---");
try {
  const a = (await one("SELECT COUNT(*) AS c FROM drillCustomizations")).c;
  const b = (await one("SELECT COUNT(*) AS c FROM drill_customizations")).c;
  console.log(`drillCustomizations: ${a} rows | drill_customizations: ${b} rows`);
  if (b > 0) add("MED", "schema", `Both drillCustomizations (camelCase) and drill_customizations (snake_case) tables exist — pick one and drop the other`);
} catch (e) { console.log(e.message); }

try {
  const r = (await one("SELECT COUNT(*) AS c FROM drills_review")).c;
  console.log(`drills_review: ${r} rows`);
  if (r > 0) add("LOW", "schema", `drills_review table has ${r} rows — confirm if it's still needed or drop`);
} catch (e) {}

// --- 7. ATHLETE ACTIVITY / LOG BLOAT ---
console.log("\n--- ACTIVITY LOG SIZE ---");
try {
  const aaTotal = (await one("SELECT COUNT(*) AS c FROM athleteActivity")).c;
  const aaOld = (await one("SELECT COUNT(*) AS c FROM athleteActivity WHERE createdAt < (NOW() - INTERVAL 90 DAY)")).c;
  console.table({ athleteActivity_total: aaTotal, older_than_90d: aaOld });
  if (aaTotal > 10000) add("LOW", "growth", `${aaTotal} athleteActivity rows — consider archive/prune policy`);
} catch (e) {}

try {
  const enlTotal = (await one("SELECT COUNT(*) AS c FROM emailNotificationLog")).c;
  console.log(`emailNotificationLog rows: ${enlTotal}`);
} catch (e) {}

// --- 8. INVITES ---
console.log("\n--- INVITES ---");
try {
  const iTotal = (await one("SELECT COUNT(*) AS c FROM invites")).c;
  const cols = await q("SHOW COLUMNS FROM invites");
  const hasAccepted = cols.some((c) => c.Field === "acceptedAt");
  const hasExpires = cols.some((c) => c.Field === "expiresAt");
  let iPending = null, iExpired = null;
  if (hasAccepted) iPending = (await one("SELECT COUNT(*) AS c FROM invites WHERE acceptedAt IS NULL")).c;
  if (hasExpires && hasAccepted) iExpired = (await one("SELECT COUNT(*) AS c FROM invites WHERE acceptedAt IS NULL AND expiresAt IS NOT NULL AND expiresAt < NOW()")).c;
  console.table({ total: iTotal, pending: iPending, expired_pending: iExpired });
  if (iExpired > 0) add("LOW", "invites", `${iExpired} expired pending invites — consider purge`);
} catch (e) { console.log("invites: " + e.message); }

// --- 9. VIDEO ANALYSIS ---
try {
  const vaTotal = (await one("SELECT COUNT(*) AS c FROM videoAnalysis")).c;
  console.log(`\nvideoAnalysis rows: ${vaTotal}`);
} catch (e) {}

// --- FINAL: prioritized findings ---
console.log("\n\n=========================================");
console.log("PRIORITIZED FINDINGS");
console.log("=========================================");
const order = { HIGH: 0, MED: 1, LOW: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity]);
if (findings.length === 0) {
  console.log("No issues detected.");
} else {
  for (const f of findings) {
    console.log(`[${f.severity.padEnd(4)}] ${f.area.padEnd(14)} ${f.msg}`);
  }
}

await conn.end();
