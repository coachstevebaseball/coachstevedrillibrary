import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
for (const p of ["/home/ubuntu/usab-drills-directory/.env", resolve(here, "..", ".env")]) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}

const TARGET_SLUG = "roll-the-ball-on-ground-front-toss";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Read source data
  const [[cd]] = await conn.execute(
    `SELECT * FROM customDrills WHERE drillId = ? LIMIT 1`, [TARGET_SLUG]
  );
  if (!cd) {
    console.error(`No customDrills row for ${TARGET_SLUG}. Aborting.`);
    process.exit(1);
  }
  const [[existing]] = await conn.execute(
    `SELECT drillId FROM drills WHERE drillId = ? LIMIT 1`, [TARGET_SLUG]
  );
  if (existing) {
    console.log(`Already in drills — nothing to do.`);
    process.exit(0);
  }

  // Parse JSON-stringified fields if present
  const parseJsonArr = (s) => {
    if (!s) return null;
    try { const v = JSON.parse(s); return Array.isArray(v) ? v : null; }
    catch { return null; }
  };

  await conn.beginTransaction();

  const [ins] = await conn.execute(
    `INSERT INTO drills
      (drillId, name, difficulty, categories, duration, drillType,
       ageLevel, tags, problem, goal, problems, outcomes,
       source, isHidden, createdBy)
     VALUES (?, ?, ?, CAST(? AS JSON), ?, ?,
       CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON),
       CAST(? AS JSON), CAST(? AS JSON),
       'custom', 1, ?)`,
    [
      cd.drillId,
      cd.name,
      cd.difficulty,
      JSON.stringify([cd.category || "Hitting"]),
      cd.duration || null,
      cd.drillType || null,
      JSON.stringify(parseJsonArr(cd.ageLevel)),
      JSON.stringify(parseJsonArr(cd.focusTags)),
      JSON.stringify(parseJsonArr(cd.problemsFix)),
      JSON.stringify(parseJsonArr(cd.pillars)),
      JSON.stringify(parseJsonArr(cd.problemsFix)), // mirror to canonical problems[]
      JSON.stringify(parseJsonArr(cd.pillars)),     // mirror to canonical outcomes[]
      cd.createdBy ?? null,
    ]
  );

  console.log(`Inserted into drills (id=${ins.insertId}): ${cd.name}`);

  // Verify it exists hidden
  const [[verify]] = await conn.execute(
    `SELECT drillId, name, categories, difficulty, source, isHidden FROM drills WHERE drillId = ?`,
    [TARGET_SLUG]
  );
  console.log("Result:", verify);

  if (!verify || verify.isHidden !== 1) {
    console.error("Unexpected state — rolling back.");
    await conn.rollback();
    process.exit(1);
  }

  await conn.commit();
  console.log("\n✓ Committed (hidden).");
} catch (e) {
  console.error("Error — rolling back:", e.message);
  await conn.rollback();
  process.exit(1);
} finally {
  await conn.end();
}
