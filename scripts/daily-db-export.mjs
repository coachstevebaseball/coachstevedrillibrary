/**
 * daily-db-export.mjs
 * -------------------
 * Exports every table in the TiDB Cloud database to a single SQL dump file,
 * then uploads it to S3-compatible storage (Supabase Storage or AWS S3).
 * Retains the last 30 daily backups and deletes older ones automatically.
 *
 * Run manually:   node scripts/daily-db-export.mjs
 * Scheduled by:   The Manus task scheduler (daily at 2:00 AM ET)
 */

import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, "../.backups");
const RETENTION_DAYS = 30;

// ─── Config ──────────────────────────────────────────────────────────────────

const DB_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = "db-backups"; // create this bucket in Supabase Storage

if (!DB_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function log(msg) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${msg}`);
}

function escapeValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  if (Buffer.isBuffer(val)) return `0x${val.toString("hex")}`;
  if (typeof val === "object") {
    // JSON columns
    return `'${JSON.stringify(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

async function exportDatabase() {
  const startTime = Date.now();
  const ts = timestamp();
  const filename = `coachsteve-backup-${ts}.sql`;

  log(`🚀 Starting database export: ${filename}`);

  const conn = await mysql.createConnection({
    uri: DB_URL,
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  });

  // Get all table names (excluding Drizzle internal table)
  const [tableRows] = await conn.execute("SHOW TABLES");
  const tables = tableRows
    .map((r) => Object.values(r)[0])
    .filter((t) => t !== "__drizzle_migrations");

  log(`📋 Found ${tables.length} tables to export`);

  let sql = "";

  // Header
  sql += `-- ============================================================\n`;
  sql += `-- Coach Steve Hitters Lab — Daily Database Backup\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Tables: ${tables.length}\n`;
  sql += `-- ============================================================\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS=0;\n`;
  sql += `SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n`;
  sql += `SET NAMES utf8mb4;\n\n`;

  let totalRows = 0;

  for (const table of tables) {
    log(`  → Exporting table: ${table}`);

    // Get CREATE TABLE statement
    const [[createRow]] = await conn.execute(`SHOW CREATE TABLE \`${table}\``);
    const createStmt = Object.values(createRow)[1];

    sql += `-- ----------------------------------------------------------\n`;
    sql += `-- Table: ${table}\n`;
    sql += `-- ----------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += `${createStmt};\n\n`;

    // Get all rows
    const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);

    if (rows.length === 0) {
      sql += `-- (empty table)\n\n`;
      continue;
    }

    totalRows += rows.length;
    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `\`${c}\``).join(", ");

    // Batch INSERT statements (500 rows per batch for performance)
    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const values = batch
        .map((row) => `(${columns.map((c) => escapeValue(row[c])).join(", ")})`)
        .join(",\n  ");
      sql += `INSERT INTO \`${table}\` (${colList}) VALUES\n  ${values};\n`;
    }
    sql += `\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
  sql += `\n-- Export complete. Total rows: ${totalRows}\n`;

  await conn.end();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`✅ Export complete: ${tables.length} tables, ${totalRows} rows in ${elapsed}s`);
  log(`📦 SQL size: ${(sql.length / 1024).toFixed(1)} KB`);

  return { filename, sql, tables: tables.length, rows: totalRows };
}

// ─── Upload to Supabase Storage ───────────────────────────────────────────────

async function uploadToSupabase(filename, sqlContent) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log("⚠️  Supabase credentials not set — saving locally only");
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const buffer = Buffer.from(sqlContent, "utf-8");

  log(`☁️  Uploading to Supabase Storage: ${SUPABASE_BUCKET}/${filename}`);

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filename, buffer, {
      contentType: "application/sql",
      upsert: false,
    });

  if (error) {
    log(`❌ Upload failed: ${error.message}`);
    return null;
  }

  log(`✅ Uploaded successfully: ${data.path}`);
  return data.path;
}

// ─── Save Local Copy ──────────────────────────────────────────────────────────

function saveLocally(filename, sqlContent) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const filepath = path.join(BACKUP_DIR, filename);
  writeFileSync(filepath, sqlContent, "utf-8");
  log(`💾 Saved locally: ${filepath}`);
  return filepath;
}

// ─── Cleanup Old Backups (Supabase) ──────────────────────────────────────────

async function cleanupOldBackups() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: files, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .list("", { limit: 100, sortBy: { column: "created_at", order: "asc" } });

  if (error || !files) {
    log(`⚠️  Could not list backups for cleanup: ${error?.message}`);
    return;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const toDelete = files.filter(
    (f) => f.name.startsWith("coachsteve-backup-") && new Date(f.created_at) < cutoff
  );

  if (toDelete.length === 0) {
    log(`🗂️  No old backups to delete (retention: ${RETENTION_DAYS} days)`);
    return;
  }

  const { error: deleteError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .remove(toDelete.map((f) => f.name));

  if (deleteError) {
    log(`⚠️  Cleanup error: ${deleteError.message}`);
  } else {
    log(`🗑️  Deleted ${toDelete.length} old backup(s) older than ${RETENTION_DAYS} days`);
  }
}

// ─── Notify Owner ─────────────────────────────────────────────────────────────

async function notifyOwner(result, uploadPath) {
  const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
  const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
  const OWNER_ID = process.env.OWNER_OPEN_ID;

  if (!FORGE_URL || !FORGE_KEY || !OWNER_ID) return;

  try {
    const res = await fetch(`${FORGE_URL}/notification/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FORGE_KEY}`,
      },
      body: JSON.stringify({
        openId: OWNER_ID,
        title: "✅ Daily Database Backup Complete",
        content: `Backup: ${result.filename}\nTables: ${result.tables} | Rows: ${result.rows}\nStorage: ${uploadPath ?? "local only"}\nTime: ${new Date().toISOString()}`,
      }),
    });
    if (res.ok) log("📬 Owner notification sent");
  } catch (e) {
    log(`⚠️  Notification failed: ${e.message}`);
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  try {
    // 1. Export the database
    const result = await exportDatabase();

    // 2. Save locally
    saveLocally(result.filename, result.sql);

    // 3. Upload to Supabase Storage
    const uploadPath = await uploadToSupabase(result.filename, result.sql);

    // 4. Clean up old backups
    await cleanupOldBackups();

    // 5. Notify owner
    await notifyOwner(result, uploadPath);

    log(`🎉 Daily backup complete: ${result.filename}`);
    process.exit(0);
  } catch (err) {
    console.error("💥 Backup failed:", err);
    process.exit(1);
  }
}

main();
