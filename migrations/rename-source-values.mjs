/**
 * Idempotent migration: rename source column values
 *   orphan → imported
 *   video-orphan → video-imported
 */
import m from 'mysql2/promise';

const conn = await m.createConnection(process.env.DATABASE_URL);

// Check current distribution
const [before] = await conn.query('SELECT source, COUNT(*) as cnt FROM drills GROUP BY source ORDER BY cnt DESC');
console.log('Before:', before);

// Rename orphan → imported
const [r1] = await conn.query("UPDATE drills SET source = 'imported' WHERE source = 'orphan'");
console.log(`orphan → imported: ${r1.affectedRows} rows`);

// Rename video-orphan → video-imported
const [r2] = await conn.query("UPDATE drills SET source = 'video-imported' WHERE source = 'video-orphan'");
console.log(`video-orphan → video-imported: ${r2.affectedRows} rows`);

// Verify
const [after] = await conn.query('SELECT source, COUNT(*) as cnt FROM drills GROUP BY source ORDER BY cnt DESC');
console.log('After:', after);

await conn.end();
