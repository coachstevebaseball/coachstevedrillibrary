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

  const [upd] = await conn.execute(`
    UPDATE drillDetails dd
    JOIN drills d ON d.drillId = dd.drillId
    SET dd.difficulty = d.difficulty
    WHERE d.difficulty IS NOT NULL
      AND dd.difficulty <> d.difficulty
  `);
  console.log(`Synced ${upd.affectedRows} drillDetails rows`);

  // Verify no remaining conflicts
  const [[{ remaining }]] = await conn.execute(`
    SELECT COUNT(*) AS remaining
    FROM drills d
    JOIN drillDetails dd ON dd.drillId = d.drillId
    WHERE d.difficulty IS NOT NULL
      AND dd.difficulty <> d.difficulty
  `);
  if (remaining !== 0) {
    console.error(`Unexpected ${remaining} conflicts remain — rolling back.`);
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
