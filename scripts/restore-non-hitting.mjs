/**
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

console.log('\n=== Restoring supplementary JSON files ===');
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
console.log('\n=== drills.ts Restoration ===');
console.log('  The archived drills.ts entries are in _archived/drills-ts-non-hitting.ts');
console.log('  To restore: copy the archived entries back into the drillsData array in drills.ts');

// 4. Restore DB drills
console.log('\n=== Database Restoration ===');
console.log('  Run this SQL to unhide DB drills:');
console.log("  UPDATE drillDetails SET isHidden = 0 WHERE isHidden = 1;");
console.log("  UPDATE customDrills SET isHidden = 0 WHERE isHidden = 1;");

console.log('\n✅ Restoration complete. Restart the dev server to see changes.');
