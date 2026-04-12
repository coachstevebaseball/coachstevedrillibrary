/**
 * Filter drills.ts to keep only Hitting drills.
 * Archives non-Hitting entries to _archived/drills-ts-non-hitting.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROJECT = '/home/ubuntu/usab-drills-directory';
const drillsTsPath = join(PROJECT, 'client/src/data/drills.ts');
const archivePath = join(PROJECT, 'client/src/data/_archived/drills-ts-non-hitting.ts');

const content = readFileSync(drillsTsPath, 'utf8');

// Find the start of the drillsData array
const arrayStartMatch = content.match(/const drillsData:\s*Drill\[\]\s*=\s*\[/);
if (!arrayStartMatch) {
  console.error('Could not find drillsData array start');
  process.exit(1);
}

const arrayStartIdx = content.indexOf(arrayStartMatch[0]);
const beforeArray = content.substring(0, arrayStartIdx);

// Find the end of the array (the matching closing bracket)
// We need to find where the array ends
const afterArrayStart = content.substring(arrayStartIdx + arrayStartMatch[0].length);

// Parse individual drill entries by finding each { ... } block
// Each drill entry starts with "  {" and ends with "  },"
const drillEntries = [];
let braceDepth = 0;
let currentEntry = '';
let inArray = false;
let entryStart = -1;

const fullArrayContent = content.substring(arrayStartIdx + arrayStartMatch[0].length);

for (let i = 0; i < fullArrayContent.length; i++) {
  const char = fullArrayContent[i];
  
  if (char === '{') {
    if (braceDepth === 0) {
      entryStart = i;
    }
    braceDepth++;
  } else if (char === '}') {
    braceDepth--;
    if (braceDepth === 0 && entryStart >= 0) {
      const entry = fullArrayContent.substring(entryStart, i + 1);
      drillEntries.push(entry);
      entryStart = -1;
    }
  } else if (char === ']' && braceDepth === 0) {
    // End of array
    break;
  }
}

console.log(`Found ${drillEntries.length} drill entries in drills.ts`);

// Classify each entry as Hitting or non-Hitting
const hittingEntries = [];
const nonHittingEntries = [];

for (const entry of drillEntries) {
  const catMatch = entry.match(/categories:\s*\[["'](.+?)["']\]/);
  const category = catMatch ? catMatch[1] : 'Unknown';
  
  if (category === 'Hitting') {
    hittingEntries.push(entry);
  } else {
    nonHittingEntries.push(entry);
  }
}

console.log(`Hitting entries: ${hittingEntries.length}`);
console.log(`Non-Hitting entries: ${nonHittingEntries.length}`);

// Find everything after the array (export default, etc.)
const exportMatch = content.match(/\];\s*\n\s*export default drillsData;/);
const exportIdx = content.lastIndexOf('export default drillsData;');
const afterExport = content.substring(exportIdx);

// Build the new drills.ts with only Hitting entries
const newDrillsTs = beforeArray + 
  'const drillsData: Drill[] = [\n' +
  hittingEntries.map(e => '  ' + e.trim()).join(',\n') + 
  '\n];\n\n' + afterExport;

writeFileSync(drillsTsPath, newDrillsTs);
console.log(`✅ drills.ts updated: ${hittingEntries.length} Hitting drills`);

// Archive non-Hitting entries
const archiveContent = `// Archived non-Hitting drills from drills.ts
// To restore: copy these entries back into the drillsData array in drills.ts
// Categories: ${[...new Set(nonHittingEntries.map(e => {
  const m = e.match(/categories:\s*\[["'](.+?)["']\]/);
  return m ? m[1] : 'Unknown';
}))].join(', ')}
// Total: ${nonHittingEntries.length} drills

export const archivedNonHittingDrills = [
${nonHittingEntries.map(e => '  ' + e.trim()).join(',\n')}
];
`;

writeFileSync(archivePath, archiveContent);
console.log(`✅ Archived ${nonHittingEntries.length} non-Hitting entries to _archived/drills-ts-non-hitting.ts`);
