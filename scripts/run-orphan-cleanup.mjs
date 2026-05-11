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

try {
  await conn.beginTransaction();

  // 1. Insert placeholder user if not present
  let placeholderId;
  const [existing] = await conn.execute(
    `SELECT id FROM users WHERE openId = 'deleted-athletes-placeholder' LIMIT 1`
  );
  if (existing.length > 0) {
    placeholderId = existing[0].id;
    console.log(`Placeholder already exists (id=${placeholderId})`);
  } else {
    const [ins] = await conn.execute(
      `INSERT INTO users (openId, name, role, isActiveClient)
       VALUES ('deleted-athletes-placeholder', 'Deleted Athlete', 'athlete', 0)`
    );
    placeholderId = ins.insertId;
    console.log(`Inserted placeholder user (id=${placeholderId})`);
  }

  // 2. Rebind orphan COMPLETED rows to placeholder
  const [rebind] = await conn.execute(
    `UPDATE drillAssignments
     SET userId = ?, athleteName = 'Deleted Athlete'
     WHERE userId IS NOT NULL
       AND userId NOT IN (SELECT id FROM users)
       AND status = 'completed'`,
    [placeholderId]
  );
  console.log(`Rebound ${rebind.affectedRows} completed orphan rows to placeholder`);

  // 3. Delete orphan assigned/in-progress rows
  const [del] = await conn.execute(
    `DELETE FROM drillAssignments
     WHERE userId IS NOT NULL
       AND userId NOT IN (SELECT id FROM users)
       AND status IN ('assigned', 'in-progress')`
  );
  console.log(`Deleted ${del.affectedRows} assigned/in-progress orphan rows`);

  // 4. Verify final state
  const [[{ remaining }]] = await conn.query(
    `SELECT COUNT(*) AS remaining
     FROM drillAssignments
     WHERE userId IS NOT NULL AND userId NOT IN (SELECT id FROM users)`
  );
  const [[{ history }]] = await conn.query(
    `SELECT COUNT(*) AS history FROM drillAssignments WHERE userId = ?`,
    [placeholderId]
  );
  const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM drillAssignments`);
  console.log(`\nVerification: remaining_orphans=${remaining}, history_rows=${history}, total=${total}`);

  if (remaining !== 0) {
    console.error("Unexpected remaining orphans — rolling back.");
    await conn.rollback();
    process.exit(1);
  }

  await conn.commit();
  console.log("\n✓ Committed.");
} catch (e) {
  console.error("Error — rolling back:", e.message);
  await conn.rollback();
  process.exit(1);
} finally {
  await conn.end();
}
