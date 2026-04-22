import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const url = process.env.DATABASE_URL;
const m = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({
  host: m[3], port: +m[4], user: m[1], password: m[2], database: m[5],
  ssl: { rejectUnauthorized: false }
});

const BACKUP_DIR = '/home/ubuntu/usab-drills-directory/backups/pre-consolidation-' + new Date().toISOString().slice(0, 10);
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const TABLES = [
  'drills',
  'customDrills',
  'drillDetails',
  'drillVideos',
  'drillAssignments',
  'drillFavorites',
  'drillCustomizations',
  'notifications',
  'pendingEmailAlerts',
  'emailNotificationLog',
  'notificationPreferences',
  'users',
  'invites',
];

for (const table of TABLES) {
  try {
    const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
    const filePath = path.join(BACKUP_DIR, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
    console.log(`✓ ${table}: ${rows.length} rows → ${filePath}`);
  } catch (e) {
    console.log(`✗ ${table}: ${e.message}`);
  }
}

// Also get column schemas for reference
const schemaPath = path.join(BACKUP_DIR, '_schemas.json');
const schemas = {};
for (const table of TABLES) {
  try {
    const [cols] = await conn.execute(`DESCRIBE \`${table}\``);
    schemas[table] = cols;
  } catch (e) {
    schemas[table] = { error: e.message };
  }
}
fs.writeFileSync(schemaPath, JSON.stringify(schemas, null, 2));
console.log(`\n✓ Column schemas → ${schemaPath}`);

await conn.end();
console.log(`\n✅ Full backup complete → ${BACKUP_DIR}`);
