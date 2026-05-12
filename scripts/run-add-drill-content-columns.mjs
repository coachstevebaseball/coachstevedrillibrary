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

async function colExists(name) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'drills' AND column_name = ?`,
    [name]
  );
  return rows[0].c > 0;
}

const additions = [
  { name: "equipment",         ddl: "ALTER TABLE `drills` ADD `equipment` json" },
  { name: "repsSets",          ddl: "ALTER TABLE `drills` ADD `repsSets` varchar(100)" },
  { name: "nextStepDrillIds",  ddl: "ALTER TABLE `drills` ADD `nextStepDrillIds` json" },
  { name: "featured",          ddl: "ALTER TABLE `drills` ADD `featured` boolean DEFAULT false NOT NULL" },
];

try {
  for (const a of additions) {
    if (await colExists(a.name)) {
      console.log(`✓ ${a.name} already exists — skipping`);
      continue;
    }
    await conn.execute(a.ddl);
    console.log(`+ added ${a.name}`);
  }

  // Verify
  const [[{ total }]] = await conn.execute(`SELECT COUNT(*) AS total FROM drills`);
  const [[{ featuredFalse }]] = await conn.execute(
    `SELECT COUNT(*) AS featuredFalse FROM drills WHERE featured = false`
  );
  console.log(`\nVerification: drills total = ${total}, with featured=false = ${featuredFalse}`);

  console.log("\n✓ Done.");
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
} finally {
  await conn.end();
}
