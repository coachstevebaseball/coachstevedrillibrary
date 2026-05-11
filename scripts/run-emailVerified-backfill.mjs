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

  // Show who would change
  const [preview] = await conn.execute(
    `SELECT id, email, name, role FROM users WHERE emailVerified = 0 AND email IS NOT NULL AND email <> ''`
  );
  console.log(`Will mark ${preview.length} users as verified:`);
  console.table(preview);

  const [upd] = await conn.execute(
    `UPDATE users SET emailVerified = 1
     WHERE emailVerified = 0 AND email IS NOT NULL AND email <> ''`
  );
  console.log(`\nUpdated ${upd.affectedRows} rows`);

  const [[{ remaining }]] = await conn.execute(
    `SELECT COUNT(*) AS remaining FROM users WHERE emailVerified = 0 AND email IS NOT NULL AND email <> ''`
  );
  if (remaining !== 0) {
    console.error(`Unexpected ${remaining} unverified-with-email remain — rolling back.`);
    await conn.rollback();
    process.exit(1);
  }

  const [[{ withoutEmail }]] = await conn.execute(
    `SELECT COUNT(*) AS withoutEmail FROM users WHERE emailVerified = 0`
  );
  console.log(`Users still emailVerified=0 (no email — expected, e.g. Deleted Athlete placeholder): ${withoutEmail}`);

  await conn.commit();
  console.log("\n✓ Committed.");
} catch (e) {
  console.error("Error — rolling back:", e.message);
  await conn.rollback();
  process.exit(1);
} finally {
  await conn.end();
}
