/**
 * repair-blast-player-ids.mjs
 *
 * Repairs orphaned blastSessions records whose playerId still references
 * old UUIDs that no longer exist in blastPlayers.
 *
 * Strategy:
 *  1. Build a mapping of old UUID -> new player ID using the sessionNotes
 *     athleteId as the bridge (sessionNotes.athleteId -> users.id -> blastPlayers.userId)
 *  2. For old UUIDs that can't be resolved via sessionNotes, attempt to match
 *     by player name similarity against blastPlayers.fullName
 *  3. UPDATE blastSessions.playerId for every matched orphan
 *  4. Also ensure blastPlayers rows that still have UUID ids get their id
 *     updated to match their userId (integer) for full consistency
 *
 * Run with: node scripts/repair-blast-player-ids.mjs
 * Add --dry-run to preview changes without writing to DB.
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const isDryRun = process.argv.includes('--dry-run');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env manually
const envPath = path.join(__dirname, '..', '.env');
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match) DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Set it in .env or environment.');
  process.exit(1);
}

async function main() {
  const db = await createConnection(DATABASE_URL);
  console.log(`\n🔧 Blast Player ID Repair Script ${isDryRun ? '(DRY RUN)' : '(LIVE)'}\n`);

  // ─── Step 1: Get current blastPlayers ───────────────────────────────────────
  const [players] = await db.query('SELECT id, fullName, blastEmail, userId FROM blastPlayers');
  console.log(`📋 Current blastPlayers (${players.length} rows):`);
  players.forEach(p => console.log(`   id="${p.id}"  name="${p.fullName}"  userId=${p.userId}`));

  // ─── Step 2: Get all orphaned old UUIDs ─────────────────────────────────────
  const [orphans] = await db.query(`
    SELECT DISTINCT s.playerId as old_id, COUNT(*) as session_count
    FROM blastSessions s
    LEFT JOIN blastPlayers p ON s.playerId = p.id
    WHERE p.id IS NULL
    GROUP BY s.playerId
  `);
  console.log(`\n⚠️  Orphaned old playerIds (${orphans.length} distinct UUIDs, ${orphans.reduce((a,o)=>a+Number(o.session_count),0)} sessions):`);
  orphans.forEach(o => console.log(`   "${o.old_id}" → ${o.session_count} sessions`));

  // ─── Step 3: Build old UUID -> new player ID mapping via sessionNotes ────────
  const [noteLinks] = await db.query(`
    SELECT DISTINCT sn.athleteId, bs.playerId as old_blast_id, u.name, u.email
    FROM sessionNotes sn
    JOIN blastSessions bs ON sn.blastSessionId = bs.id
    LEFT JOIN users u ON sn.athleteId = u.id
    ORDER BY sn.athleteId
  `);

  // Build: old_uuid -> new blastPlayer.id (via athleteId -> users.id -> blastPlayers.userId)
  const uuidToNewId = new Map();
  const unmapped = [];

  for (const link of noteLinks) {
    const oldUuid = link.old_blast_id;
    if (!oldUuid) continue;

    // Find the blastPlayer whose userId matches this athleteId
    const matchedPlayer = players.find(p => String(p.userId) === String(link.athleteId));
    if (matchedPlayer) {
      if (!uuidToNewId.has(oldUuid)) {
        uuidToNewId.set(oldUuid, { newId: matchedPlayer.id, name: matchedPlayer.fullName, method: 'athleteId→userId' });
      }
    } else {
      // Try matching by name
      const nameMatch = players.find(p =>
        p.fullName.toLowerCase().trim() === (link.name || '').toLowerCase().trim()
      );
      if (nameMatch) {
        if (!uuidToNewId.has(oldUuid)) {
          uuidToNewId.set(oldUuid, { newId: nameMatch.id, name: nameMatch.fullName, method: 'name match' });
        }
      } else if (!uuidToNewId.has(oldUuid)) {
        unmapped.push({ oldUuid, athleteId: link.athleteId, name: link.name, email: link.email });
      }
    }
  }

  // Also handle orphans with no sessionNotes link at all
  for (const orphan of orphans) {
    if (!uuidToNewId.has(orphan.old_id)) {
      unmapped.push({ oldUuid: orphan.old_id, athleteId: null, name: null, email: null });
    }
  }

  console.log(`\n✅ Resolved mappings (${uuidToNewId.size}):`);
  for (const [oldId, info] of uuidToNewId) {
    console.log(`   "${oldId}" → "${info.newId}" (${info.name}) [via ${info.method}]`);
  }

  if (unmapped.length > 0) {
    console.log(`\n❓ Could NOT resolve (${unmapped.length}) — manual intervention required:`);
    unmapped.forEach(u => console.log(`   "${u.oldUuid}"  athleteId=${u.athleteId}  name="${u.name}"  email="${u.email}"`));
  }

  // ─── Step 4: Apply UPDATEs ───────────────────────────────────────────────────
  if (uuidToNewId.size === 0) {
    console.log('\n⚠️  No mappings found. Nothing to update.');
    await db.end();
    return;
  }

  console.log(`\n${isDryRun ? '🔍 DRY RUN — would execute:' : '⚡ Executing UPDATEs:'}`);
  let totalUpdated = 0;

  for (const [oldId, info] of uuidToNewId) {
    const sql = `UPDATE blastSessions SET playerId = ? WHERE playerId = ?`;
    const params = [info.newId, oldId];
    console.log(`   UPDATE blastSessions SET playerId='${info.newId}' WHERE playerId='${oldId}'  (→ ${info.name})`);

    if (!isDryRun) {
      const [result] = await db.execute(sql, params);
      console.log(`     ✓ ${result.affectedRows} rows updated`);
      totalUpdated += result.affectedRows;
    }
  }

  // ─── Step 5: Fix blastPlayers rows that still have UUID ids ─────────────────
  const uuidPlayers = players.filter(p => p.id.includes('-') && p.userId);
  if (uuidPlayers.length > 0) {
    console.log(`\n🔄 blastPlayers rows with UUID id that should use integer userId (${uuidPlayers.length}):`);
    for (const p of uuidPlayers) {
      console.log(`   blastPlayers id="${p.id}" → should be id="${p.userId}" (${p.fullName})`);
      if (!isDryRun) {
        // First update any blastSessions still pointing to this UUID
        await db.execute(`UPDATE blastSessions SET playerId = ? WHERE playerId = ?`, [String(p.userId), p.id]);
        // Then update the blastPlayers id itself
        await db.execute(`UPDATE blastPlayers SET id = ? WHERE id = ?`, [String(p.userId), p.id]);
        console.log(`     ✓ blastPlayers.id updated to "${p.userId}"`);
      }
    }
  }

  if (!isDryRun) {
    console.log(`\n✅ Done! ${totalUpdated} blastSessions rows re-linked.`);
  } else {
    console.log(`\n✅ Dry run complete. Run without --dry-run to apply changes.`);
  }

  await db.end();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
