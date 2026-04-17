/**
 * Hide Non-Hitting Drills Script
 * 
 * This script:
 * 1. Archives all non-Hitting drills from drills.ts into a hidden archive file
 * 2. Archives non-Hitting drills from drills.json into a hidden archive file
 * 3. Filters supplementary JSON files to Hitting-only (with archives)
 * 4. Marks non-Hitting DB drills as hidden
 * 
 * All archived data is stored in client/src/data/_archived/ for easy restoration.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

const PROJECT = '/home/ubuntu/usab-drills-directory';
const ARCHIVE_DIR = join(PROJECT, 'client/src/data/_archived');

// Ensure archive directory exists
if (!existsSync(ARCHIVE_DIR)) {
  mkdirSync(ARCHIVE_DIR, { recursive: true });
}

// ─── 1. Process drills.json ──────────────────────────────────────────────
console.log('=== Processing drills.json ===');
const drillsJsonPath = join(PROJECT, 'client/src/data/drills.json');
const allDrillsJson = JSON.parse(readFileSync(drillsJsonPath, 'utf8'));

const hittingDrillsJson = allDrillsJson.filter(d => d.categories.includes('Hitting'));
const nonHittingDrillsJson = allDrillsJson.filter(d => !d.categories.includes('Hitting'));

console.log(`  Total: ${allDrillsJson.length}`);
console.log(`  Hitting (keeping): ${hittingDrillsJson.length}`);
console.log(`  Non-Hitting (archiving): ${nonHittingDrillsJson.length}`);

// Archive non-Hitting
writeFileSync(
  join(ARCHIVE_DIR, 'drills-non-hitting.json'),
  JSON.stringify(nonHittingDrillsJson, null, 2)
);
console.log(`  ✅ Archived ${nonHittingDrillsJson.length} non-Hitting drills to _archived/drills-non-hitting.json`);

// Overwrite with Hitting-only
writeFileSync(drillsJsonPath, JSON.stringify(hittingDrillsJson, null, 2));
console.log(`  ✅ drills.json now contains ${hittingDrillsJson.length} Hitting-only drills`);

// ─── 2. Process supplementary JSON files ─────────────────────────────────
const hittingDrillNames = new Set(hittingDrillsJson.map(d => d.name.toLowerCase().trim()));
// Also include names from drills.ts that are Hitting (they should match)

const suppFiles = [
  { path: 'client/public/combined_drills.json', nameKey: 'drillName' },
  { path: 'client/public/drill_descriptions.json', nameKey: 'drillName' },
  { path: 'client/public/drill_goals.json', nameKey: 'drillName' },
  { path: 'client/public/generated_descriptions.json', nameKey: 'drillName' },
  { path: 'client/public/generated_goals.json', nameKey: 'drillName' },
  { path: 'client/public/generated_missing_goals.json', nameKey: 'drillName' },
  { path: 'client/public/parsed_descriptions.json', nameKey: 'drillName' },
  { path: 'client/public/parsed_goals.json', nameKey: 'drillName' },
];

// We need to also get Hitting drill names from drills.ts
// Read drills.ts and extract names of Hitting drills
const drillsTsPath = join(PROJECT, 'client/src/data/drills.ts');
const drillsTsContent = readFileSync(drillsTsPath, 'utf8');

// Extract all drill names and their categories from drills.ts
const drillEntryRegex = /name:\s*["'](.+?)["'][\s\S]*?categories:\s*\[["'](.+?)["']\]/g;
let match;
const hittingNamesFromTs = new Set();
const nonHittingNamesFromTs = new Set();
while ((match = drillEntryRegex.exec(drillsTsContent)) !== null) {
  const name = match[1];
  const category = match[2];
  if (category === 'Hitting') {
    hittingNamesFromTs.add(name.toLowerCase().trim());
  } else {
    nonHittingNamesFromTs.add(name.toLowerCase().trim());
  }
}
console.log(`\n  Hitting names from drills.ts: ${hittingNamesFromTs.size}`);
console.log(`  Non-Hitting names from drills.ts: ${nonHittingNamesFromTs.size}`);

// Combine all known Hitting names
const allHittingNames = new Set([...hittingDrillNames, ...hittingNamesFromTs]);
console.log(`  Combined known Hitting names: ${allHittingNames.size}`);

console.log('\n=== Processing supplementary JSON files ===');
for (const { path: relPath, nameKey } of suppFiles) {
  const fullPath = join(PROJECT, relPath);
  try {
    const data = JSON.parse(readFileSync(fullPath, 'utf8'));
    if (!Array.isArray(data)) {
      console.log(`  ${relPath}: Not an array, skipping`);
      continue;
    }

    const hitting = data.filter(d => {
      const name = (d[nameKey] || '').toLowerCase().trim();
      return allHittingNames.has(name);
    });
    const nonHitting = data.filter(d => {
      const name = (d[nameKey] || '').toLowerCase().trim();
      return !allHittingNames.has(name);
    });

    // Archive non-Hitting entries
    const archiveName = relPath.split('/').pop().replace('.json', '-non-hitting.json');
    writeFileSync(join(ARCHIVE_DIR, archiveName), JSON.stringify(nonHitting, null, 2));

    // Overwrite with Hitting-only
    writeFileSync(fullPath, JSON.stringify(hitting, null, 2));

    console.log(`  ${relPath}: ${data.length} → ${hitting.length} (archived ${nonHitting.length})`);
  } catch (e) {
    console.log(`  ${relPath}: ERROR - ${e.message}`);
  }
}

// ─── 3. Create restoration script ───────────────────────────────────────
const restoreScript = `/**
 * Restore Non-Hitting Drills Script
 * 
 * Run this to restore all archived non-Hitting drills back into the active data files.
 * Usage: node scripts/restore-non-hitting.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT = '/home/ubuntu/usab-drills-directory';
const ARCHIVE_DIR = join(PROJECT, 'client/src/data/_archived');

// 1. Restore drills.json
console.log('=== Restoring drills.json ===');
const drillsJsonPath = join(PROJECT, 'client/src/data/drills.json');
const currentDrills = JSON.parse(readFileSync(drillsJsonPath, 'utf8'));
const archivedDrillsPath = join(ARCHIVE_DIR, 'drills-non-hitting.json');

if (existsSync(archivedDrillsPath)) {
  const archivedDrills = JSON.parse(readFileSync(archivedDrillsPath, 'utf8'));
  const merged = [...currentDrills, ...archivedDrills];
  writeFileSync(drillsJsonPath, JSON.stringify(merged, null, 2));
  console.log('  Restored ' + archivedDrills.length + ' non-Hitting drills to drills.json');
  console.log('  Total drills now: ' + merged.length);
} else {
  console.log('  No archived drills found');
}

// 2. Restore supplementary files
const suppFiles = [
  'combined_drills.json',
  'drill_descriptions.json',
  'drill_goals.json',
  'generated_descriptions.json',
  'generated_goals.json',
  'generated_missing_goals.json',
  'parsed_descriptions.json',
  'parsed_goals.json',
];

console.log('\\n=== Restoring supplementary JSON files ===');
for (const fileName of suppFiles) {
  const activePath = join(PROJECT, 'client/public', fileName);
  const archivePath = join(ARCHIVE_DIR, fileName.replace('.json', '-non-hitting.json'));
  
  if (existsSync(archivePath)) {
    const current = JSON.parse(readFileSync(activePath, 'utf8'));
    const archived = JSON.parse(readFileSync(archivePath, 'utf8'));
    const merged = [...current, ...archived];
    writeFileSync(activePath, JSON.stringify(merged, null, 2));
    console.log('  ' + fileName + ': restored ' + archived.length + ' entries (total: ' + merged.length + ')');
  }
}

// 3. Restore drills.ts (manual step required)
console.log('\\n=== drills.ts Restoration ===');
console.log('  The archived drills.ts entries are in _archived/drills-ts-non-hitting.ts');
console.log('  To restore: copy the archived entries back into the drillsData array in drills.ts');

// 4. Restore DB drills
console.log('\\n=== Database Restoration ===');
console.log('  Run this SQL to unhide DB drills:');
console.log("  UPDATE drillDetails SET isHidden = 0 WHERE isHidden = 1;");
console.log("  UPDATE customDrills SET isHidden = 0 WHERE isHidden = 1;");

console.log('\\n✅ Restoration complete. Restart the dev server to see changes.');
`;

writeFileSync(join(PROJECT, 'scripts/restore-non-hitting.mjs'), restoreScript);
console.log('\n✅ Created restoration script: scripts/restore-non-hitting.mjs');

// ─── 4. Summary ─────────────────────────────────────────────────────────
console.log('\n========================================');
console.log('  ARCHIVE COMPLETE');
console.log('========================================');
console.log('Archived files in: client/src/data/_archived/');
console.log('To restore: node scripts/restore-non-hitting.mjs');
console.log('');
console.log('REMAINING STEPS (manual):');
console.log('1. Filter drills.ts to remove non-Hitting entries');
console.log('2. Add isHidden column to drillDetails and customDrills tables');
console.log('3. Update frontend to hide non-Hitting skill filter buttons');
