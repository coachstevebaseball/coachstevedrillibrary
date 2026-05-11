import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  "/home/ubuntu/usab-drills-directory/.env",
  resolve(here, "..", ".env"),
];
for (const p of envCandidates) {
  if (existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Aborting.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const DRY_RUN = !args.has("--clean");

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log(`\nMode: ${DRY_RUN ? "DRY-RUN (no writes)" : "CLEAN (will delete orphans)"}\n`);

// 1. Count total assignments by binding type
const [totals] = await conn.execute(`
  SELECT
    SUM(userId IS NOT NULL) AS by_userId,
    SUM(inviteId IS NOT NULL) AS by_inviteId,
    SUM(userId IS NULL AND inviteId IS NULL) AS unbound,
    COUNT(*) AS total
  FROM drillAssignments
`);
console.log("=== ASSIGNMENT BINDING ===");
console.table(totals);

// 2. Orphan userIds: drillAssignments.userId not in users.id
const [orphanRows] = await conn.execute(`
  SELECT da.id, da.userId, da.drillId, da.drillName, da.status, da.assignedAt, da.completedAt
  FROM drillAssignments da
  LEFT JOIN users u ON u.id = da.userId
  WHERE da.userId IS NOT NULL AND u.id IS NULL
  ORDER BY da.userId, da.assignedAt
`);
console.log("\n=== ORPHAN drillAssignments (userId not found in users) ===");
console.log(`Count: ${orphanRows.length}`);
if (orphanRows.length > 0) console.table(orphanRows.slice(0, 50));
if (orphanRows.length > 50) console.log(`... ${orphanRows.length - 50} more rows hidden`);

// 3. Distinct orphan userIds + per-id row count
const orphanUserIds = [...new Set(orphanRows.map((r) => r.userId))];
console.log("\n=== ORPHAN userId SUMMARY ===");
console.table(
  orphanUserIds.map((uid) => ({
    userId: uid,
    rows: orphanRows.filter((r) => r.userId === uid).length,
  }))
);

// 4. Check the IDs the user flagged
const flagged = [10110004, 3390145];
console.log(`\n=== FLAGGED IDS (${flagged.join(", ")}) ===`);
for (const uid of flagged) {
  const [userRows] = await conn.execute("SELECT id, openId, name, email, role FROM users WHERE id = ?", [uid]);
  const [assignRows] = await conn.execute(
    "SELECT COUNT(*) AS c, MIN(assignedAt) AS first, MAX(assignedAt) AS last FROM drillAssignments WHERE userId = ?",
    [uid]
  );
  console.log(`userId ${uid}: in users table = ${userRows.length > 0 ? "YES" : "NO"}, assignment rows = ${assignRows[0].c}`);
  if (userRows.length) console.log("  user:", userRows[0]);
}

// 5. Cross-check: maybe these IDs are actually openId values
console.log("\n=== openId match check (in case IDs are Manus openIds) ===");
for (const uid of flagged) {
  const [m] = await conn.execute("SELECT id, openId, name, email, role FROM users WHERE openId = ?", [String(uid)]);
  console.log(`openId='${uid}' → ${m.length > 0 ? `users.id=${m[0].id} (${m[0].name ?? m[0].email})` : "no match"}`);
}

// 6. Suggested cleanup
console.log("\n=== SUGGESTED CLEANUP ===");
if (orphanRows.length === 0) {
  console.log("Nothing to clean — no orphans found.");
} else {
  const ids = orphanRows.map((r) => r.id);
  console.log(`Would delete ${ids.length} drillAssignments rows: ids = [${ids.slice(0, 20).join(",")}${ids.length > 20 ? ",…" : ""}]`);
  console.log("Equivalent SQL:");
  console.log(`  DELETE FROM drillAssignments WHERE id IN (${ids.join(",")});`);
  if (!DRY_RUN) {
    const [res] = await conn.execute(`DELETE FROM drillAssignments WHERE id IN (${ids.join(",")})`);
    console.log(`✓ Deleted ${res.affectedRows} rows.`);
  } else {
    console.log("\n(Re-run with --clean to apply.)");
  }
}

await conn.end();
