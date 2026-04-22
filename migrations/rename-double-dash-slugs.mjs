/**
 * Idempotent migration: rename drills with double-dash (-- or ---) slugs.
 * Updates drillId in drills + all child tables that reference it.
 */
import m from 'mysql2/promise';

const conn = await m.createConnection(process.env.DATABASE_URL);

// Find all drills with multi-dash slugs
const [allDrills] = await conn.query('SELECT id, drillId, name FROM drills');
const toRename = allDrills.filter(d => /--/.test(d.drillId));

console.log(`Found ${toRename.length} drills with double-dash slugs:`);

const childTables = [
  'drillVideos', 'drillDetails', 'drillAssignments', 'drillQuestions',
  'drillSubmissions', 'drillStatCards', 'drillPageLayouts', 'drillCustomizations'
];

for (const drill of toRename) {
  const oldSlug = drill.drillId;
  const newSlug = oldSlug.replace(/--+/g, '-');

  // Check if newSlug already exists (avoid collision)
  const [existing] = await conn.query('SELECT id FROM drills WHERE drillId = ?', [newSlug]);
  if (existing.length > 0) {
    console.log(`  SKIP ${oldSlug} → ${newSlug} (target already exists)`);
    continue;
  }

  // Update all child tables first
  for (const table of childTables) {
    try {
      const [result] = await conn.query(`UPDATE ${table} SET drillId = ? WHERE drillId = ?`, [newSlug, oldSlug]);
      if (result.affectedRows > 0) {
        console.log(`  Updated ${result.affectedRows} rows in ${table}`);
      }
    } catch (e) {
      // Table might not exist or have different column type
    }
  }

  // Update the drill itself
  await conn.query('UPDATE drills SET drillId = ? WHERE drillId = ?', [newSlug, oldSlug]);
  console.log(`  ✓ ${oldSlug} → ${newSlug}`);
}

if (toRename.length === 0) {
  console.log('No double-dash slugs found — already clean.');
}

await conn.end();
