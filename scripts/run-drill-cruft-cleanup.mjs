import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
for (const p of ["/home/ubuntu/usab-drills-directory/.env", resolve(here, "..", ".env")]) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}

const testSlugs = [
  "test-drill-1", "test-drill-2",
  "test-goal-edit-drill", "test-goal-only-drill",
  "test-persist-goal-drill", "test-update-goal-drill",
];
const badSlugs = [
  "pvc-pipe-drill:-hip-to-shoulder-separation-knee-drive",
  "slow---controlled---explode-drill",
];
const allSlugs = [...testSlugs, ...badSlugs];
const placeholders = allSlugs.map(() => "?").join(",");

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await conn.beginTransaction();

  const [dd] = await conn.execute(
    `DELETE FROM drillDetails WHERE drillId IN (${placeholders})`, allSlugs
  );
  console.log(`Deleted from drillDetails: ${dd.affectedRows}`);

  const [dv] = await conn.execute(
    `DELETE FROM drillVideos WHERE drillId IN (${placeholders})`, allSlugs
  );
  console.log(`Deleted from drillVideos: ${dv.affectedRows}`);

  const [cd] = await conn.execute(
    `DELETE FROM customDrills WHERE drillId IN (${placeholders})`, allSlugs
  );
  console.log(`Deleted from customDrills: ${cd.affectedRows}`);

  // Sanity check: none of the cruft slugs should remain anywhere
  const [[{ remaining }]] = await conn.execute(
    `SELECT
       (SELECT COUNT(*) FROM drillDetails WHERE drillId IN (${placeholders}))
     + (SELECT COUNT(*) FROM drillVideos  WHERE drillId IN (${placeholders}))
     + (SELECT COUNT(*) FROM customDrills WHERE drillId IN (${placeholders}))
     AS remaining`,
    [...allSlugs, ...allSlugs, ...allSlugs]
  );
  if (remaining !== 0) {
    console.error(`Unexpected ${remaining} cruft rows remaining — rolling back.`);
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
