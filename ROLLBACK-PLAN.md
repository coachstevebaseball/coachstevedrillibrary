# Rollback Plan — Consolidation Sprint

## When to rollback

- If drill data is corrupted or missing after consolidation
- If the frontend shows wrong drill counts or broken drill cards
- If notifications are missing that should still be visible

## Code rollback

Use the Manus checkpoint system to roll back to the pre-consolidation checkpoint:

```
Version ID: 9dbdf04c (last checkpoint before consolidation)
```

Click "Rollback" on this checkpoint in the Manus Management UI, or ask Manus to rollback.

## Database rollback

The full DB backup is stored at:

```
/home/ubuntu/usab-drills-directory/backups/pre-consolidation-{timestamp}/
```

Each table has a `.json` file with all rows. To restore a specific table:

### Option 1: Restore drills table from backup

```bash
cd /home/ubuntu/usab-drills-directory
node -e "
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { readdirSync } from 'fs';

const url = process.env.DATABASE_URL;
const m = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({ host: m[3], port: +m[4], user: m[1], password: m[2], database: m[5], ssl: { rejectUnauthorized: false } });

// Find the backup directory
const backupDir = readdirSync('backups').find(d => d.startsWith('pre-consolidation'));
const rows = JSON.parse(readFileSync('backups/' + backupDir + '/drills.json', 'utf8'));

// Truncate and re-insert
await conn.execute('DELETE FROM drills');
for (const row of rows) {
  // Re-insert each row...
  // (columns will need to match the backup schema)
}
await conn.end();
"
```

### Option 2: Restore notifications from backup

Same pattern as above but for the `notifications` table.

### Option 3: Full nuclear rollback

1. Roll back the code checkpoint to `9dbdf04c`
2. Restore all 14 backup tables from the JSON files
3. Re-run `pnpm db:push` to sync the schema

## What CANNOT be rolled back

- The `ALTER TABLE` statements that made `difficulty` and `duration` nullable are permanent. Rolling back the code checkpoint will restore the schema.ts file but the DB columns will remain nullable. This is harmless — the application code handles null values with fallbacks.

## Contact

If you need help with the rollback, ask Manus to execute it. The backup files contain all the data needed to restore any table to its pre-consolidation state.
