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

---

# Rollback Plan — Final Production Sign-Off Sprint

**Created:** 2026-04-22  
**Preserved checkpoints:** `99e191b8` (pre-consolidation), `4eebf24e` (post close-out)  
**Pre-sprint DB backup:** `/home/ubuntu/db-backup-sprint-final-2026-04-22.sql` (16.58 MB, 43 tables)  
**Original 17 MB backup:** `/home/ubuntu/db-backup-pre-consolidation-2026-04-22.sql`

---

## P1 Changes

### 1. Expose Non-Hitting Skill Filters on Homepage
- **What changed:** Homepage filter bar updated to show all 6 skill categories with live counts.
- **Rollback:** Revert `client/src/pages/Home.tsx` to checkpoint `4eebf24e`. No DB changes.

### 2. Normalize Difficulty Scale
- **What changed:** 48 drills updated from `difficulty='Intermediate'` to `difficulty='Medium'`.
- **Rollback SQL:** `UPDATE drills SET difficulty = 'Intermediate' WHERE difficulty = 'Medium' AND id IN (<list of 48 IDs>);`
- **Note:** Enum constraint added to schema. Rollback requires reverting schema and running `pnpm db:push`.

### 3. Review 26 Failed Email Deliveries
- **What changed:** CSV export only. No DB modifications.
- **Rollback:** N/A — read-only operation.

### 4. Cascade Delete Logic on Drills
- **What changed:** `deleteDrill()` in `server/db.ts` now cascade-deletes child rows in a transaction.
- **Rollback:** Revert `server/db.ts` to checkpoint `4eebf24e`. No DB schema changes.

### 5. /api/health/jobs Endpoint
- **What changed:** New endpoint added. Job registry tracks last-run timestamps in memory.
- **Rollback:** Revert `server/notificationService.ts` and any new files. Remove route registration.

### 6. Rate Limiting on Public Drill Endpoints
- **What changed:** `express-rate-limit` middleware added to `/api/trpc` for unauthenticated requests.
- **Rollback:** Remove middleware from server entry. Run `pnpm remove express-rate-limit`.

---

## P2 Changes

### 7. Slug Rename for 8 Double-Dash Drills
- **What changed:** 8 slugs normalized from `--` to `-`. 301 redirects added at route layer.
- **Rollback SQL:** Reverse slug updates (original slugs documented in migration script).
- **Rollback code:** Remove redirect map from route handler.

### 8. Remove Vestigial drills.ts
- **What changed:** `client/src/data/drills.ts` deleted. All callers migrated to `trpc.drillsDirectory.list`.
- **Rollback:** Restore file from checkpoint `4eebf24e`.

### 9. Rename Source Column Values
- **What changed:** `source='orphan'` → `'imported'`, `source='video-orphan'` → `'video-imported'`.
- **Rollback SQL:** `UPDATE drills SET source = 'orphan' WHERE source = 'imported'; UPDATE drills SET source = 'video-orphan' WHERE source = 'video-imported';`

### 10. Consolidate Dual Tag Systems
- **What changed:** Legacy `problem`/`goal` arrays merged into `problems`/`outcomes`. Filter logic reads only from new columns. Legacy columns soft-deprecated (NOT dropped).
- **Rollback:** Revert filter logic in `server/db.ts` and `client/src/pages/Home.tsx`. Legacy columns remain intact — no data loss.
