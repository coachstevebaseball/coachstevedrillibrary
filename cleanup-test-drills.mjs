import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "4000"),
  user: url.username,
  password: url.password,
  database: url.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
});

// Restore 1-2-3-drill problems using string interpolation (TiDB JSON workaround)
const originalProblems = JSON.stringify(["Timing Issues", "Bat Path Issues", "No Rhythm"]);
await connection.query(
  `UPDATE drills SET problems = '${originalProblems.replace(/'/g, "\\'")}' WHERE drillId = '1-2-3-drill'`
);
console.log("✓ Restored 1-2-3-drill problems");

// Delete test drills
const [del] = await connection.query("DELETE FROM drills WHERE drillId LIKE 'test-drill-%'");
console.log(`✓ Deleted ${del.affectedRows} test drills`);

const [count] = await connection.query("SELECT COUNT(*) as cnt FROM drills WHERE isHidden = 0");
console.log(`✓ Final visible drill count: ${count[0].cnt}`);

await connection.end();
