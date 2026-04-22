/**
 * Idempotent migration: Normalize difficulty 'Intermediate' → 'Medium'
 * Safe to re-run — only updates rows where difficulty = 'Intermediate'.
 */
import m from 'mysql2/promise';

const conn = await m.createConnection(process.env.DATABASE_URL);

// Check current state
const [before] = await conn.query("SELECT COUNT(*) as cnt FROM drills WHERE difficulty = 'Intermediate'");
console.log(`[normalize-difficulty] Rows with difficulty='Intermediate': ${before[0].cnt}`);

if (before[0].cnt > 0) {
  // Record affected IDs for rollback reference
  const [affected] = await conn.query("SELECT id, drillId, difficulty FROM drills WHERE difficulty = 'Intermediate'");
  console.log(`[normalize-difficulty] Affected drill IDs: ${affected.map(r => r.drillId).join(', ')}`);

  // Perform the update
  const [result] = await conn.query("UPDATE drills SET difficulty = 'Medium' WHERE difficulty = 'Intermediate'");
  console.log(`[normalize-difficulty] Updated ${result.affectedRows} rows: Intermediate → Medium`);
} else {
  console.log('[normalize-difficulty] No rows to update — already normalized.');
}

// Verify
const [after] = await conn.query("SELECT difficulty, COUNT(*) as cnt FROM drills GROUP BY difficulty ORDER BY difficulty");
console.log('[normalize-difficulty] Final difficulty distribution:');
for (const r of after) {
  console.log(`  ${r.difficulty ?? 'NULL'}: ${r.cnt}`);
}

await conn.end();
console.log('[normalize-difficulty] Done.');
