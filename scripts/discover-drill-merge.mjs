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

console.log("\n=== READ-ONLY DISCOVERY (no writes) ===\n");

// 1. Row counts per table
for (const t of ["drills", "customDrills", "drillDetails", "drillVideos"]) {
  const [[{ c }]] = await conn.execute(`SELECT COUNT(*) AS c FROM \`${t}\``);
  const [[{ visible }]] = await conn.execute(
    t === "drillVideos"
      ? `SELECT COUNT(*) AS visible FROM \`${t}\``
      : `SELECT COUNT(*) AS visible FROM \`${t}\` WHERE isHidden = false`
  );
  console.log(`${t}: total=${c}, visible=${visible}`);
}

// 2. Universe of distinct drillIds across all four tables
const [universe] = await conn.execute(`
  SELECT drillId FROM drills
  UNION SELECT drillId FROM customDrills
  UNION SELECT drillId FROM drillDetails
  UNION SELECT drillId FROM drillVideos
`);
console.log(`\nUnique drillIds across all 4 tables: ${universe.length}`);

// 3. Overlap: which tables each drillId appears in
const [overlap] = await conn.execute(`
  SELECT
    SUM(in_drills + in_custom + in_details + in_videos = 4) AS in_all_4,
    SUM(in_drills + in_custom + in_details + in_videos = 3) AS in_any_3,
    SUM(in_drills + in_custom + in_details + in_videos = 2) AS in_any_2,
    SUM(in_drills + in_custom + in_details + in_videos = 1) AS in_only_1
  FROM (
    SELECT drillId,
      MAX(CASE WHEN src='drills'        THEN 1 ELSE 0 END) AS in_drills,
      MAX(CASE WHEN src='customDrills'  THEN 1 ELSE 0 END) AS in_custom,
      MAX(CASE WHEN src='drillDetails'  THEN 1 ELSE 0 END) AS in_details,
      MAX(CASE WHEN src='drillVideos'   THEN 1 ELSE 0 END) AS in_videos
    FROM (
      SELECT drillId, 'drills' AS src FROM drills
      UNION ALL SELECT drillId, 'customDrills' FROM customDrills
      UNION ALL SELECT drillId, 'drillDetails' FROM drillDetails
      UNION ALL SELECT drillId, 'drillVideos' FROM drillVideos
    ) u
    GROUP BY drillId
  ) g
`);
console.log("\nOverlap (how many tables each drillId appears in):");
console.table(overlap);

// 4. Missing from `drills`: drillIds that ARE in details/videos/custom but NOT in drills
const [missingTally] = await conn.execute(`
  SELECT
    SUM(in_custom)  AS missing_but_in_custom,
    SUM(in_details) AS missing_but_in_details,
    SUM(in_videos)  AS missing_but_in_videos,
    COUNT(*)        AS total_missing
  FROM (
    SELECT drillId,
      MAX(CASE WHEN src='customDrills' THEN 1 ELSE 0 END) AS in_custom,
      MAX(CASE WHEN src='drillDetails' THEN 1 ELSE 0 END) AS in_details,
      MAX(CASE WHEN src='drillVideos'  THEN 1 ELSE 0 END) AS in_videos
    FROM (
      SELECT drillId, 'customDrills' AS src FROM customDrills
      UNION ALL SELECT drillId, 'drillDetails' FROM drillDetails
      UNION ALL SELECT drillId, 'drillVideos' FROM drillVideos
    ) u
    WHERE drillId NOT IN (SELECT drillId FROM drills)
    GROUP BY drillId
  ) m
`);
console.log("\ndrillIds missing from `drills` (would surface after merge):");
console.table(missingTally);

// 5. Sample of 20 missing drills with whatever metadata is available
const [sample] = await conn.execute(`
  SELECT
    u.drillId,
    cd.name              AS custom_name,
    dd.skillSet          AS detail_skillset,
    dd.difficulty        AS detail_difficulty,
    cd.difficulty        AS custom_difficulty,
    cd.category          AS custom_category,
    (cd.drillId IS NOT NULL) AS has_custom,
    (dd.drillId IS NOT NULL) AS has_detail,
    (dv.drillId IS NOT NULL) AS has_video
  FROM (
    SELECT DISTINCT drillId FROM (
      SELECT drillId FROM customDrills
      UNION SELECT drillId FROM drillDetails
      UNION SELECT drillId FROM drillVideos
    ) x
    WHERE drillId NOT IN (SELECT drillId FROM drills)
    ORDER BY drillId
    LIMIT 20
  ) u
  LEFT JOIN customDrills cd ON cd.drillId = u.drillId
  LEFT JOIN drillDetails dd ON dd.drillId = u.drillId
  LEFT JOIN drillVideos  dv ON dv.drillId = u.drillId
`);
console.log("\nSample of 20 drillIds that would surface:");
console.table(sample);

// 6. Naming gap: of the missing drillIds, how many have NO name source at all?
const [namingGap] = await conn.execute(`
  SELECT
    SUM(cd.drillId IS NULL) AS no_custom_name,
    SUM(cd.drillId IS NOT NULL) AS has_custom_name,
    COUNT(*) AS total
  FROM (
    SELECT DISTINCT drillId FROM (
      SELECT drillId FROM customDrills
      UNION SELECT drillId FROM drillDetails
      UNION SELECT drillId FROM drillVideos
    ) x
    WHERE drillId NOT IN (SELECT drillId FROM drills)
  ) u
  LEFT JOIN customDrills cd ON cd.drillId = u.drillId
`);
console.log("\nNaming gap (for missing drillIds, do we have a name to use?):");
console.table(namingGap);
console.log("  no_custom_name = will need slug-derived name (e.g. '1-2-3-drill' → '1-2-3 Drill')");

// 7. Data conflicts: drillIds in multiple tables where difficulty disagrees
const [conflicts] = await conn.execute(`
  SELECT
    d.drillId,
    d.difficulty   AS drills_difficulty,
    cd.difficulty  AS custom_difficulty,
    dd.difficulty  AS detail_difficulty
  FROM drills d
  LEFT JOIN customDrills cd ON cd.drillId = d.drillId
  LEFT JOIN drillDetails dd ON dd.drillId = d.drillId
  WHERE (cd.drillId IS NOT NULL AND cd.difficulty <> d.difficulty)
     OR (dd.drillId IS NOT NULL AND dd.difficulty <> d.difficulty)
  LIMIT 20
`);
console.log(`\nDifficulty conflicts on drillIds present in multiple tables (top 20):`);
console.log(`Count: ${conflicts.length}`);
if (conflicts.length > 0) console.table(conflicts);

// 8. Reference check: tables that reference drillId, how many references point to "missing" drillIds
console.log("\nReferences to drillIds that aren't in `drills` (currently broken pointers):");
for (const t of ["drillAssignments", "drillFavorites", "drillCustomizations", "drillPageLayouts"]) {
  try {
    const [[{ c }]] = await conn.execute(`
      SELECT COUNT(*) AS c FROM \`${t}\` WHERE drillId IS NOT NULL AND drillId NOT IN (SELECT drillId FROM drills)
    `);
    console.log(`  ${t}: ${c} rows reference a drillId not in drills`);
  } catch (e) {
    console.log(`  ${t}: skipped (${e.message})`);
  }
}

// 9. drillIds in drills but isHidden=true (already hidden, distinct from "missing")
const [[{ hidden }]] = await conn.execute(`SELECT COUNT(*) AS hidden FROM drills WHERE isHidden = true`);
const [[{ visible }]] = await conn.execute(`SELECT COUNT(*) AS visible FROM drills WHERE isHidden = false`);
console.log(`\nCurrent drills table: ${visible} visible + ${hidden} hidden = ${visible + hidden} total rows`);

await conn.end();
