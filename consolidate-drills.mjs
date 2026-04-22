/**
 * IDEMPOTENT Drill Consolidation Script
 * 
 * Merges all orphaned drills from customDrills, drillDetails, and drillVideos
 * into the unified `drills` table. Safe to re-run without creating duplicates.
 * 
 * Rules:
 * - Name resolution: customDrills.name → drillDetails goal (first line) → drillId slug → quarantine
 * - Category: customDrills.category → drillDetails.skillSet → inferred from drillId → "Uncategorized" (flagged)
 * - Difficulty: preserve existing, leave null if missing
 * - Unmatched rows go to drills_review quarantine table
 * - FK sanity check at the end
 */

import { createConnection } from 'mysql2/promise';
import fs from 'fs';

const url = process.env.DATABASE_URL;
const m = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({
  host: m[3], port: +m[4], user: m[1], password: m[2], database: m[5],
  ssl: { rejectUnauthorized: false }
});

const stats = { created: 0, skipped: 0, quarantined: 0, errors: [] };

// ─── Step 0: Create quarantine table if not exists ───
await conn.execute(`
  CREATE TABLE IF NOT EXISTS drills_review (
    id INT AUTO_INCREMENT PRIMARY KEY,
    drillId VARCHAR(255) NOT NULL,
    sourceTable VARCHAR(50) NOT NULL,
    reason TEXT,
    rawData JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_drill (drillId, sourceTable)
  )
`);
console.log('✓ drills_review quarantine table ready');

// ─── Step 1: Get existing drills ───
const [existingDrills] = await conn.execute('SELECT drillId FROM drills');
const existingSet = new Set(existingDrills.map(r => r.drillId));
console.log(`\n✓ ${existingSet.size} drills already in drills table`);

// ─── Category inference from drillId slug ───
function inferCategory(drillId, goal) {
  const id = drillId.toLowerCase();
  const g = (goal || '').toLowerCase();
  
  // Hitting patterns
  if (id.startsWith('flaw--')) return 'Hitting';
  if (id.includes('tee') || id.includes('toss') || id.includes('bat') || id.includes('swing')) return 'Hitting';
  if (id.includes('barrel') || id.includes('contact') || id.includes('stance') || id.includes('load')) return 'Hitting';
  if (id.includes('hip-') && (g.includes('hit') || g.includes('swing') || g.includes('bat'))) return 'Hitting';
  if (g.includes('hitter') || g.includes('swing') || g.includes('bat speed') || g.includes('barrel')) return 'Hitting';
  
  // Infield patterns
  if (id.includes('backhand') || id.includes('groundball') || id.includes('fungo')) return 'Infield';
  if (id.includes('double-play') || id.includes('shortstop') || id.includes('infield')) return 'Infield';
  if (id.includes('1st-base') || id.includes('fielding') || id.includes('short-hop')) return 'Infield';
  if (id.includes('shuffle') || id.includes('forehand') || id.includes('slow-roller')) return 'Infield';
  if (id.includes('pick-') && (id.includes('stick') || id.includes('rake'))) return 'Infield';
  if (g.includes('infield') || g.includes('ground ball') || g.includes('fielding')) return 'Infield';
  if (g.includes('double play') || g.includes('shortstop') || g.includes('first base')) return 'Infield';
  
  // Outfield patterns
  if (id.includes('outfield') || id.includes('fly-ball') || id.includes('one-cut')) return 'Outfield';
  if (id === 'ball-in-the-sun') return 'Outfield';
  if (g.includes('outfield') || g.includes('fly ball')) return 'Outfield';
  
  // Pitching patterns
  if (id.includes('pitch') || id.includes('change-up') || id.includes('fastball')) return 'Pitching';
  if (id.includes('curveball') || id.includes('slider') || id.includes('mound')) return 'Pitching';
  if (g.includes('pitch') || g.includes('arm speed') || g.includes('mound')) return 'Pitching';
  
  // Bunting patterns
  if (id.includes('bunt')) return 'Bunting';
  if (g.includes('bunt')) return 'Bunting';
  
  // Baserunning patterns
  if (id.includes('baserun') || id.includes('steal') || id.includes('lead-off')) return 'Baserunning';
  if (g.includes('baserun') || g.includes('steal')) return 'Baserunning';
  
  return null; // Can't determine → will be flagged
}

// ─── Name from drillId slug ───
function nameFromSlug(slug) {
  if (!slug) return 'Unknown Drill';
  return slug
    .replace(/^flaw--/, 'Flaw: ')
    .replace(/-+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ─── Step 2: Merge customDrills orphans ───
console.log('\n── Merging customDrills ──');
const [customOrphans] = await conn.execute(
  'SELECT cd.drillId, cd.name, cd.difficulty, cd.category, cd.duration FROM customDrills cd LEFT JOIN drills d ON cd.drillId = d.drillId WHERE d.drillId IS NULL'
);

for (const cd of customOrphans) {
  if (existingSet.has(cd.drillId)) { stats.skipped++; continue; }
  
  const category = cd.category || inferCategory(cd.drillId, '') || 'Uncategorized';
  const name = cd.name || nameFromSlug(cd.drillId);
  
  try {
    await conn.execute(
      `INSERT INTO drills (drillId, name, difficulty, categories, duration, url, isDirectLink, isHidden, source, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'custom', NOW(), NOW())
       ON DUPLICATE KEY UPDATE drillId = drillId`,
      [cd.drillId, name, cd.difficulty || null, JSON.stringify([category]), cd.duration || null, '', ]
    );
    existingSet.add(cd.drillId);
    stats.created++;
    console.log(`  + ${cd.drillId} (${category}, ${cd.difficulty || 'null'}) [from customDrills]`);
  } catch (e) {
    stats.errors.push({ drillId: cd.drillId, source: 'customDrills', error: e.message });
    console.log(`  ✗ ${cd.drillId}: ${e.message}`);
  }
}

// ─── Step 3: Merge drillDetails orphans ───
console.log('\n── Merging drillDetails orphans ──');
const [ddOrphans] = await conn.execute(
  'SELECT dd.drillId, dd.skillSet, dd.difficulty, dd.goal FROM drillDetails dd LEFT JOIN drills d ON dd.drillId = d.drillId WHERE d.drillId IS NULL'
);

for (const dd of ddOrphans) {
  if (existingSet.has(dd.drillId)) { stats.skipped++; continue; }
  
  // Category: use skillSet, but resolve "Custom" via inference
  let category = dd.skillSet;
  if (!category || category === 'Custom') {
    category = inferCategory(dd.drillId, dd.goal) || 'Uncategorized';
  }
  
  const name = nameFromSlug(dd.drillId);
  const difficulty = dd.difficulty || null;
  
  if (category === 'Uncategorized') {
    // Quarantine
    try {
      await conn.execute(
        `INSERT INTO drills_review (drillId, sourceTable, reason, rawData)
         VALUES (?, 'drillDetails', 'Could not determine category', ?)
         ON DUPLICATE KEY UPDATE drillId = drillId`,
        [dd.drillId, JSON.stringify({ skillSet: dd.skillSet, goal: dd.goal, difficulty: dd.difficulty })]
      );
      stats.quarantined++;
      console.log(`  ⚠ ${dd.drillId} → quarantined (Uncategorized)`);
    } catch (e) {
      stats.errors.push({ drillId: dd.drillId, source: 'drillDetails-quarantine', error: e.message });
    }
    
    // Still insert into drills but hidden, so admin can review
    try {
      await conn.execute(
        `INSERT INTO drills (drillId, name, difficulty, categories, duration, url, isDirectLink, isHidden, source, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NULL, '', 0, 1, 'orphan', NOW(), NOW())
         ON DUPLICATE KEY UPDATE drillId = drillId`,
        [dd.drillId, name, difficulty, JSON.stringify([category])]
      );
      existingSet.add(dd.drillId);
      stats.created++;
      console.log(`  + ${dd.drillId} (${category}, hidden) [from drillDetails, needs review]`);
    } catch (e) {
      stats.errors.push({ drillId: dd.drillId, source: 'drillDetails', error: e.message });
    }
    continue;
  }
  
  try {
    await conn.execute(
      `INSERT INTO drills (drillId, name, difficulty, categories, duration, url, isDirectLink, isHidden, source, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NULL, '', 0, 0, 'orphan', NOW(), NOW())
       ON DUPLICATE KEY UPDATE drillId = drillId`,
      [dd.drillId, name, difficulty, JSON.stringify([category])]
    );
    existingSet.add(dd.drillId);
    stats.created++;
    console.log(`  + ${dd.drillId} (${category}, ${difficulty || 'null'}) [from drillDetails]`);
  } catch (e) {
    stats.errors.push({ drillId: dd.drillId, source: 'drillDetails', error: e.message });
    console.log(`  ✗ ${dd.drillId}: ${e.message}`);
  }
}

// ─── Step 4: Merge drillVideos-only orphans ───
console.log('\n── Merging drillVideos-only orphans ──');
const [dvOrphans] = await conn.execute(`
  SELECT dv.drillId, dv.videoUrl FROM drillVideos dv
  LEFT JOIN drills d ON dv.drillId = d.drillId
  WHERE d.drillId IS NULL
  GROUP BY dv.drillId
`);

for (const dv of dvOrphans) {
  if (existingSet.has(dv.drillId)) { stats.skipped++; continue; }
  
  const category = inferCategory(dv.drillId, '') || 'Uncategorized';
  const name = nameFromSlug(dv.drillId);
  
  if (category === 'Uncategorized') {
    try {
      await conn.execute(
        `INSERT INTO drills_review (drillId, sourceTable, reason, rawData)
         VALUES (?, 'drillVideos', 'Video-only orphan, could not determine category', ?)
         ON DUPLICATE KEY UPDATE drillId = drillId`,
        [dv.drillId, JSON.stringify({ videoUrl: dv.videoUrl })]
      );
      stats.quarantined++;
      console.log(`  ⚠ ${dv.drillId} → quarantined (video-only, Uncategorized)`);
    } catch (e) {
      stats.errors.push({ drillId: dv.drillId, source: 'drillVideos-quarantine', error: e.message });
    }
  }
  
  try {
    await conn.execute(
      `INSERT INTO drills (drillId, name, difficulty, categories, duration, url, isDirectLink, isHidden, source, createdAt, updatedAt)
       VALUES (?, ?, NULL, ?, NULL, '', 0, ?, 'video-orphan', NOW(), NOW())
       ON DUPLICATE KEY UPDATE drillId = drillId`,
      [dv.drillId, name, JSON.stringify([category]), category === 'Uncategorized' ? 1 : 0]
    );
    existingSet.add(dv.drillId);
    stats.created++;
    console.log(`  + ${dv.drillId} (${category}${category === 'Uncategorized' ? ', hidden' : ''}) [from drillVideos]`);
  } catch (e) {
    stats.errors.push({ drillId: dv.drillId, source: 'drillVideos', error: e.message });
    console.log(`  ✗ ${dv.drillId}: ${e.message}`);
  }
}

// ─── Step 5: FK Sanity Check ───
console.log('\n── FK Sanity Check ──');

const [assignmentCheck] = await conn.execute(`
  SELECT COUNT(*) as broken FROM drillAssignments da
  LEFT JOIN drills d ON da.drillId = d.drillId
  WHERE d.drillId IS NULL
`);
console.log(`  drillAssignments → drills: ${assignmentCheck[0].broken} broken FKs`);

const [favCheck] = await conn.execute(`
  SELECT COUNT(*) as broken FROM drillFavorites df
  LEFT JOIN drills d ON df.drillId = d.drillId
  WHERE d.drillId IS NULL
`);
console.log(`  drillFavorites → drills: ${favCheck[0].broken} broken FKs`);

const [custCheck] = await conn.execute(`
  SELECT COUNT(*) as broken FROM drillCustomizations dc
  LEFT JOIN drills d ON dc.drillId = d.drillId
  WHERE d.drillId IS NULL
`);
console.log(`  drillCustomizations → drills: ${custCheck[0].broken} broken FKs`);

const [detailCheck] = await conn.execute(`
  SELECT COUNT(*) as broken FROM drillDetails dd
  LEFT JOIN drills d ON dd.drillId = d.drillId
  WHERE d.drillId IS NULL
`);
console.log(`  drillDetails → drills: ${detailCheck[0].broken} broken FKs`);

const [videoCheck] = await conn.execute(`
  SELECT COUNT(*) as broken FROM drillVideos dv
  LEFT JOIN drills d ON dv.drillId = d.drillId
  WHERE d.drillId IS NULL
`);
console.log(`  drillVideos → drills: ${videoCheck[0].broken} broken FKs`);

// ─── Step 6: Final count ───
const [finalCount] = await conn.execute('SELECT COUNT(*) as cnt FROM drills');
const [hiddenCount] = await conn.execute('SELECT COUNT(*) as cnt FROM drills WHERE isHidden = 1');
const [reviewCount] = await conn.execute('SELECT COUNT(*) as cnt FROM drills_review');

console.log(`\n═══════════════════════════════════════`);
console.log(`  CONSOLIDATION COMPLETE`);
console.log(`  Created: ${stats.created}`);
console.log(`  Skipped (already existed): ${stats.skipped}`);
console.log(`  Quarantined for review: ${stats.quarantined}`);
console.log(`  Errors: ${stats.errors.length}`);
console.log(`  Total drills in table: ${finalCount[0].cnt}`);
console.log(`  Hidden: ${hiddenCount[0].cnt}`);
console.log(`  In drills_review: ${reviewCount[0].cnt}`);
console.log(`═══════════════════════════════════════`);

if (stats.errors.length > 0) {
  console.log('\nErrors:');
  stats.errors.forEach(e => console.log(`  ${e.drillId} (${e.source}): ${e.error}`));
}

// Save stats
fs.writeFileSync('/home/ubuntu/usab-drills-directory/consolidation-stats.json', JSON.stringify(stats, null, 2));

await conn.end();
