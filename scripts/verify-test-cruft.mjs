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

console.log("\n=== TEST-CRUFT DISCOVERY v2 (read-only) ===\n");

// Cruft names spotted in the admin export PDF.
const cruftNames = [
  "Bulk Drill One", "Bulk Drill Two",
  "Drill To Delete", "Drill To Unhide",
  "Duplicate Test Drill", "Get Test Drill", "Good New Drill",
  "Pre-existing Drill", "Rich Coaching Drill",
  "Test Minimal Drill", "Update Rich Fields Test", "Updated Name",
];

// Also catch anything whose slug carries the 'test-drilladmin' or
// 'auto-slugdrill' prefix (these slugs were auto-generated from timestamped
// test runs).
const slugLikePatterns = [
  "test-drilladmin%", "auto-slugdrill%",
];

const oneOffs = [
  // dups / broken slug entries from the PDF
  "DblT", "Hook Ems", "One Cut Competition", "Whiffle Ball Toss",
  "Slow Controlled Explode", "Preset Backhand Pick Stick",
  "Backhand Pick Stick Fungo",
];

// 1. Buckets by name
console.log("By name:");
for (const n of cruftNames) {
  const [[{ c }]] = await conn.execute(`SELECT COUNT(*) AS c FROM drills WHERE name = ?`, [n]);
  if (c > 0) console.log(`  ${n}: ${c}`);
}

// 2. By slug-like prefix
console.log("\nBy slug-prefix:");
let totalSlug = 0;
for (const p of slugLikePatterns) {
  const [[{ c }]] = await conn.execute(`SELECT COUNT(*) AS c FROM drills WHERE drillId LIKE ?`, [p]);
  console.log(`  ${p}: ${c}`);
  totalSlug += c;
}

// 3. Suspect one-offs
console.log("\nSuspect one-offs (exact-name matches):");
let oneOffCount = 0;
const oneOffFound = [];
for (const n of oneOffs) {
  const [rows] = await conn.execute(`SELECT drillId, name FROM drills WHERE name = ?`, [n]);
  for (const r of rows) {
    console.log(`  ${r.drillId}: ${r.name}`);
    oneOffFound.push(r.drillId);
    oneOffCount++;
  }
}

// 4. Build the complete cruft id list (deduped)
const [allCruft] = await conn.execute(`
  SELECT drillId, name FROM drills
  WHERE name IN (${cruftNames.map(() => "?").join(",")})
     OR drillId LIKE 'test-drilladmin%'
     OR drillId LIKE 'auto-slugdrill%'
     OR drillId IN (${oneOffFound.length ? oneOffFound.map(() => "?").join(",") : "''"})
`, [...cruftNames, ...oneOffFound]);
console.log(`\nTotal distinct cruft rows: ${allCruft.length}`);

// Show 10 random samples
const sample = allCruft.slice(0, 10);
console.log("\nSample of what would be deleted:");
console.table(sample);

// 5. Reference check by id list to avoid orphaning
const cruftIds = allCruft.map((r) => r.drillId);
if (cruftIds.length === 0) {
  console.log("\nNothing to delete.");
} else {
  console.log("\nReferences elsewhere (would deletion orphan anything?):");
  for (const t of ["drillAssignments", "drillFavorites", "drillCustomizations", "drillDetails", "drillVideos", "drillPageLayouts"]) {
    try {
      const placeholders = cruftIds.map(() => "?").join(",");
      const [[{ c }]] = await conn.execute(
        `SELECT COUNT(*) AS c FROM \`${t}\` WHERE drillId IN (${placeholders})`,
        cruftIds
      );
      console.log(`  ${t}: ${c}`);
    } catch (e) {
      console.log(`  ${t}: skipped (${e.message})`);
    }
  }
}

// 6. Before/after counts
const [[{ total }]] = await conn.execute(`SELECT COUNT(*) AS total FROM drills`);
console.log(`\ndrills table: now=${total}, after cleanup=${total - allCruft.length}`);

await conn.end();
