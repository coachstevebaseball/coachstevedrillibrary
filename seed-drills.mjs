/**
 * Seed script: imports all static drills from client/src/data/drills.ts
 * into the unified `drills` database table.
 *
 * Run: node seed-drills.mjs
 *
 * Safe to re-run: uses INSERT ... ON DUPLICATE KEY UPDATE to upsert.
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Read drills.ts as text and extract the drillsData array ──────────────────
// We parse the TypeScript file by converting it to JSON-compatible data.
// Since the file uses TypeScript syntax, we use a simple regex extraction.

const drillsFilePath = join(__dirname, "client/src/data/drills.ts");
const drillsFileContent = readFileSync(drillsFilePath, "utf-8");

// Extract the drillsData array by finding content between `const drillsData: Drill[] = [` and `];`
const arrayMatch = drillsFileContent.match(/const drillsData: Drill\[\] = (\[[\s\S]*?\n\];)/);
if (!arrayMatch) {
  console.error("Could not find drillsData array in drills.ts");
  process.exit(1);
}

// Convert TypeScript array literal to JSON by:
// 1. Removing TypeScript-specific syntax
// 2. Converting single-quoted strings to double-quoted
// 3. Removing trailing commas
let arrayStr = arrayMatch[1];

// Replace single-quoted strings with double-quoted (careful with apostrophes in values)
// We'll use a different approach: eval the TypeScript as JavaScript
// Since it's valid JS (no type annotations in the array), we can eval it directly

// Strip TypeScript type annotations from the array content
// The array itself contains no type annotations, just plain JS objects
// Use Function constructor to safely evaluate
let drillsData;
try {
  // The array content is valid JavaScript, so we can evaluate it
  const evalFn = new Function(`return ${arrayStr}`);
  drillsData = evalFn();
  console.log(`✓ Parsed ${drillsData.length} drills from drills.ts`);
} catch (err) {
  console.error("Failed to parse drills array:", err.message);
  process.exit(1);
}

// ── Connect to database ───────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Parse DATABASE_URL: mysql://user:pass@host:port/dbname?ssl=...
const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!urlMatch) {
  console.error("Could not parse DATABASE_URL:", dbUrl);
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

console.log(`Connecting to database: ${host}:${port}/${database}`);

const conn = await createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: true },
});

console.log("✓ Connected to database");

// ── Seed drills ───────────────────────────────────────────────────────────────
let inserted = 0;
let updated = 0;
let errors = 0;

for (const drill of drillsData) {
  try {
    const [result] = await conn.execute(
      `INSERT INTO drills 
        (drillId, name, difficulty, categories, duration, url, isDirectLink, 
         ageLevel, tags, problem, goal, drillType, problems, outcomes, source, isHidden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'static', false)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         difficulty = VALUES(difficulty),
         categories = VALUES(categories),
         duration = VALUES(duration),
         url = VALUES(url),
         isDirectLink = VALUES(isDirectLink),
         ageLevel = VALUES(ageLevel),
         tags = VALUES(tags),
         problem = VALUES(problem),
         goal = VALUES(goal),
         drillType = VALUES(drillType),
         problems = VALUES(problems),
         outcomes = VALUES(outcomes),
         updatedAt = NOW()`,
      [
        drill.id,
        drill.name,
        drill.difficulty || "Medium",
        JSON.stringify(drill.categories || []),
        drill.duration || "",
        drill.url || null,
        drill.is_direct_link ? 1 : 0,
        JSON.stringify(drill.ageLevel || []),
        JSON.stringify(drill.tags || []),
        JSON.stringify(drill.problem || []),
        JSON.stringify(drill.goal || []),
        drill.drillType || null,
        JSON.stringify(drill.problems || []),
        JSON.stringify(drill.outcomes || []),
      ]
    );

    if (result.affectedRows === 1) {
      inserted++;
    } else if (result.affectedRows === 2) {
      updated++;
    }
  } catch (err) {
    console.error(`✗ Error seeding drill "${drill.name}":`, err.message);
    errors++;
  }
}

await conn.end();

console.log("\n── Seed Results ──────────────────────────────────────────────");
console.log(`  Inserted: ${inserted}`);
console.log(`  Updated:  ${updated}`);
console.log(`  Errors:   ${errors}`);
console.log(`  Total:    ${drillsData.length}`);
console.log("──────────────────────────────────────────────────────────────");

if (errors > 0) {
  console.error("\n⚠ Some drills failed to seed. Check errors above.");
  process.exit(1);
} else {
  console.log("\n✓ All drills seeded successfully!");
}
