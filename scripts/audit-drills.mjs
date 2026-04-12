import { readFileSync } from 'fs';

const drills = JSON.parse(readFileSync('./client/src/data/drills.json', 'utf8'));
console.log('Total drills:', drills.length);

// Count by category
const catCounts = {};
drills.forEach(d => {
  d.categories.forEach(cat => {
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
});

console.log('\nCategory breakdown:');
Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, cnt]) => {
  console.log(`  ${cat}: ${cnt}`);
});

// Find drills that have Hitting category
const hittingDrills = drills.filter(d => d.categories.some(c => c.toLowerCase().includes('hitting')));
const nonHittingDrills = drills.filter(d => !d.categories.some(c => c.toLowerCase().includes('hitting')));

console.log('\nHitting drills:', hittingDrills.length);
console.log('Non-Hitting drills:', nonHittingDrills.length);

// Show non-hitting drills by category
console.log('\nNon-Hitting drills by category:');
const nonHitCats = {};
nonHittingDrills.forEach(d => {
  d.categories.forEach(cat => {
    nonHitCats[cat] = (nonHitCats[cat] || 0) + 1;
  });
});
Object.entries(nonHitCats).sort((a, b) => b[1] - a[1]).forEach(([cat, cnt]) => {
  console.log(`  ${cat}: ${cnt}`);
});

// Show all non-hitting drill names
console.log('\nAll non-Hitting drills:');
nonHittingDrills.forEach(d => {
  console.log(`  [${d.categories.join(', ')}] ${d.name} (ID: ${d.id})`);
});

// Show hitting drill category subcategories
console.log('\nHitting drill categories (for filter cleanup):');
const hitCats = {};
hittingDrills.forEach(d => {
  d.categories.forEach(cat => {
    hitCats[cat] = (hitCats[cat] || 0) + 1;
  });
});
Object.entries(hitCats).sort((a, b) => b[1] - a[1]).forEach(([cat, cnt]) => {
  console.log(`  ${cat}: ${cnt}`);
});
