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

console.log("\n=== 2b: DRILL CRUFT — READ-ONLY PREVIEW ===\n");

const testSlugs = [
  "test-drill-1", "test-drill-2",
  "test-goal-edit-drill", "test-goal-only-drill",
  "test-persist-goal-drill", "test-update-goal-drill",
];
const badSlugs = [
  "pvc-pipe-drill:-hip-to-shoulder-separation-knee-drive", // bad slug — colon
  "slow---controlled---explode-drill",                      // triple-dash dup
];

const allSlugs = [...testSlugs, ...badSlugs];
const placeholders = allSlugs.map(() => "?").join(",");

console.log("Rows in drillDetails that would be deleted:");
const [dd] = await conn.execute(
  `SELECT id, drillId, skillSet, difficulty FROM drillDetails WHERE drillId IN (${placeholders})`,
  allSlugs
);
console.table(dd);

console.log("\nRows in drillVideos that would be deleted:");
const [dv] = await conn.execute(
  `SELECT id, drillId, uploadedBy, createdAt FROM drillVideos WHERE drillId IN (${placeholders})`,
  allSlugs
);
console.table(dv);

console.log("\nRows in customDrills that would be deleted:");
const [cd] = await conn.execute(
  `SELECT id, drillId, name, difficulty FROM customDrills WHERE drillId IN (${placeholders})`,
  allSlugs
);
console.table(cd);

// Also check the duplicate's "real" form — does single-dash version exist?
console.log("\nSanity check: does the single-dash 'slow-controlled-explode-drill' exist in drills?");
const [single] = await conn.execute(
  `SELECT drillId, name, source, isHidden FROM drills WHERE drillId = 'slow-controlled-explode-drill'`
);
console.table(single);

// Reference check: do any drillAssignments / drillFavorites point to these cruft slugs?
console.log("\nReference check (would deletion orphan any references?):");
for (const t of ["drillAssignments", "drillFavorites", "drillCustomizations", "drillPageLayouts"]) {
  try {
    const [[{ c }]] = await conn.execute(
      `SELECT COUNT(*) AS c FROM \`${t}\` WHERE drillId IN (${placeholders})`,
      allSlugs
    );
    console.log(`  ${t}: ${c} reference(s) to these slugs`);
  } catch (e) {
    console.log(`  ${t}: skipped (${e.message})`);
  }
}

await conn.end();
