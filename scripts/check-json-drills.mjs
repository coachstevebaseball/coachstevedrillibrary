import { readFileSync } from 'fs';

// Load the static drills.ts data to get Hitting drill names
const drillsTs = readFileSync('client/src/data/drills.ts', 'utf8');
const hittingNames = new Set();
const nameRegex = /name:\s*"([^"]+)"/g;
let m;
while ((m = nameRegex.exec(drillsTs)) !== null) {
  hittingNames.add(m[1].toLowerCase().trim());
}
console.log(`Hitting drill names from drills.ts: ${hittingNames.size}`);

// Check each JSON file
const files = [
  'client/public/combined_drills.json',
  'client/public/drill_descriptions.json',
  'client/public/drill_goals.json',
  'client/public/generated_missing_goals.json',
  'client/public/parsed_descriptions.json',
  'client/public/parsed_goals.json',
];

for (const file of files) {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`\n${file}: empty or not array`);
      continue;
    }
    
    const nameField = data[0].drillName ? 'drillName' : data[0].name ? 'name' : null;
    if (!nameField) {
      console.log(`\n${file}: no name field found`);
      continue;
    }
    
    let hitting = 0;
    let nonHitting = 0;
    const nonHittingNames = [];
    
    for (const d of data) {
      const name = d[nameField].toLowerCase().trim();
      if (hittingNames.has(name)) {
        hitting++;
      } else {
        nonHitting++;
        nonHittingNames.push(d[nameField]);
      }
    }
    
    console.log(`\n${file}: ${data.length} total, ${hitting} Hitting, ${nonHitting} non-Hitting`);
    if (nonHittingNames.length > 0 && nonHittingNames.length <= 10) {
      nonHittingNames.forEach(n => console.log(`  - ${n}`));
    }
  } catch (e) {
    console.log(`\n${file}: error - ${e.message}`);
  }
}
