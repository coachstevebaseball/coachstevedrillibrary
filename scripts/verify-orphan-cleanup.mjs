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

console.log("\n=== READ-ONLY VERIFICATION (no writes) ===\n");

// 1. Breakdown by status of all orphans
const [byStatus] = await conn.execute(`
  SELECT status, COUNT(*) AS rows_count
  FROM drillAssignments da
  WHERE da.userId IS NOT NULL
    AND da.userId NOT IN (SELECT id FROM users)
  GROUP BY status
  ORDER BY status
`);
console.log("Orphans by status:");
console.table(byStatus);

// 2. Exact ids that would be DELETED (assigned + in-progress)
const [toDelete] = await conn.execute(`
  SELECT id, userId, drillId, status, assignedAt
  FROM drillAssignments da
  WHERE da.userId IS NOT NULL
    AND da.userId NOT IN (SELECT id FROM users)
    AND da.status IN ('assigned', 'in-progress')
  ORDER BY da.userId, da.assignedAt
`);
console.log(`\nWould DELETE ${toDelete.length} rows (status assigned/in-progress):`);
console.table(toDelete.map((r) => ({ id: r.id, userId: r.userId, status: r.status, drillId: r.drillId })));

// 3. Exact ids that would be REBOUND to placeholder
const [toRebind] = await conn.execute(`
  SELECT id, userId, drillId, drillName, status, assignedAt, completedAt
  FROM drillAssignments da
  WHERE da.userId IS NOT NULL
    AND da.userId NOT IN (SELECT id FROM users)
    AND da.status = 'completed'
  ORDER BY da.userId, da.assignedAt
`);
console.log(`\nWould REBIND ${toRebind.length} completed rows to "Deleted Athlete":`);
console.table(toRebind.map((r) => ({
  id: r.id, userId: r.userId, status: r.status,
  drillId: r.drillId,
  assignedAt: r.assignedAt?.toISOString?.().slice(0, 16) ?? r.assignedAt,
  completedAt: r.completedAt?.toISOString?.().slice(0, 16) ?? r.completedAt,
})));

// 4. Does placeholder user already exist?
const [placeholder] = await conn.execute(
  `SELECT id, name, role, isActiveClient FROM users WHERE openId = 'deleted-athletes-placeholder' LIMIT 1`
);
console.log(`\nPlaceholder user 'deleted-athletes-placeholder' exists?`,
  placeholder.length > 0 ? `YES — id=${placeholder[0].id}` : "NO — will be inserted");

// 5. Totals before/after preview
const [[{ total }]] = await conn.execute(`SELECT COUNT(*) AS total FROM drillAssignments`);
console.log(`\ndrillAssignments rows: now=${total}, after cleanup=${total - toDelete.length}`);

await conn.end();
