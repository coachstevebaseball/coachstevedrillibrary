import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
for (const p of ["/home/ubuntu/usab-drills-directory/.env", resolve(here, "..", ".env")]) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}

const cruftNames = [
  "Bulk Drill One", "Bulk Drill Two",
  "Drill To Delete", "Drill To Unhide",
  "Duplicate Test Drill", "Get Test Drill", "Good New Drill",
  "Pre-existing Drill", "Rich Coaching Drill",
  "Test Minimal Drill", "Update Rich Fields Test", "Updated Name",
];
const oneOffNames = [
  "DblT", "Hook Ems", "One Cut Competition", "Whiffle Ball Toss",
  "Slow Controlled Explode", "Preset Backhand Pick Stick",
  "Backhand Pick Stick Fungo",
];

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Build the cruft drillId list
  const [rows] = await conn.execute(
    `SELECT drillId FROM drills
       WHERE name IN (${cruftNames.map(() => "?").join(",")})
          OR name IN (${oneOffNames.map(() => "?").join(",")})`,
    [...cruftNames, ...oneOffNames]
  );
  const cruftIds = rows.map((r) => r.drillId);
  if (cruftIds.length === 0) {
    console.log("Nothing to clean.");
    process.exit(0);
  }
  console.log(`Cleaning ${cruftIds.length} cruft drills...`);

  await conn.beginTransaction();

  const placeholders = cruftIds.map(() => "?").join(",");

  const [delCust] = await conn.execute(
    `DELETE FROM drillCustomizations WHERE drillId IN (${placeholders})`,
    cruftIds
  );
  console.log(`Deleted from drillCustomizations: ${delCust.affectedRows}`);

  const [delVid] = await conn.execute(
    `DELETE FROM drillVideos WHERE drillId IN (${placeholders})`,
    cruftIds
  );
  console.log(`Deleted from drillVideos: ${delVid.affectedRows}`);

  const [delDet] = await conn.execute(
    `DELETE FROM drillDetails WHERE drillId IN (${placeholders})`,
    cruftIds
  );
  console.log(`Deleted from drillDetails: ${delDet.affectedRows}`);

  const [delDrills] = await conn.execute(
    `DELETE FROM drills WHERE drillId IN (${placeholders})`,
    cruftIds
  );
  console.log(`Deleted from drills: ${delDrills.affectedRows}`);

  // Verify
  const [[{ remaining }]] = await conn.query(
    `SELECT COUNT(*) AS remaining FROM drills WHERE drillId IN (${placeholders})`,
    cruftIds
  );
  if (remaining !== 0) {
    console.error(`Unexpected ${remaining} cruft drills remain — rolling back.`);
    await conn.rollback();
    process.exit(1);
  }

  const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM drills`);
  console.log(`\nDone. drills table now has ${total} rows.`);

  await conn.commit();
  console.log("✓ Committed.");
} catch (e) {
  console.error("Error — rolling back:", e.message);
  await conn.rollback();
  process.exit(1);
} finally {
  await conn.end();
}
