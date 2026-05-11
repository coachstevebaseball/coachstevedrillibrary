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

console.log("\n=== 2c: DIFFICULTY SYNC — READ-ONLY PREVIEW ===\n");

// Every row in drillDetails whose difficulty disagrees with drills (only where drills has a value)
const [conflicts] = await conn.execute(`
  SELECT
    d.drillId,
    d.name,
    d.difficulty   AS drills_value,
    dd.difficulty  AS drilldetails_value
  FROM drills d
  JOIN drillDetails dd ON dd.drillId = d.drillId
  WHERE d.difficulty IS NOT NULL
    AND dd.difficulty <> d.difficulty
  ORDER BY d.name
`);
console.log(`Rows that would change: ${conflicts.length}`);
console.table(conflicts);

// Rows where drills.difficulty is NULL but drillDetails has a value — these stay as-is
const [[{ drillsNullKept }]] = await conn.execute(`
  SELECT COUNT(*) AS drillsNullKept
  FROM drills d
  JOIN drillDetails dd ON dd.drillId = d.drillId
  WHERE d.difficulty IS NULL
    AND dd.difficulty IS NOT NULL
`);
console.log(`\nRows kept as-is (drills.difficulty IS NULL): ${drillsNullKept}`);

// Sanity: how many will fully match after?
const [[{ alreadyMatch }]] = await conn.execute(`
  SELECT COUNT(*) AS alreadyMatch
  FROM drills d
  JOIN drillDetails dd ON dd.drillId = d.drillId
  WHERE d.difficulty IS NOT NULL
    AND dd.difficulty = d.difficulty
`);
console.log(`Rows already matching: ${alreadyMatch}`);

await conn.end();
