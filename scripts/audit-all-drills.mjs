import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  // 1. Static JSON
  const drillsJson = JSON.parse(readFileSync('./client/src/data/drills.json', 'utf8'));
  console.log('=== STATIC JSON (drills.json) ===');
  console.log('Total:', drillsJson.length);
  
  const jsonCats = {};
  drillsJson.forEach(d => d.categories.forEach(c => { jsonCats[c] = (jsonCats[c] || 0) + 1; }));
  console.log('Categories:', jsonCats);
  
  const jsonHitting = drillsJson.filter(d => d.categories.includes('Hitting'));
  const jsonNonHitting = drillsJson.filter(d => !d.categories.includes('Hitting'));
  console.log('Hitting:', jsonHitting.length);
  console.log('Non-Hitting:', jsonNonHitting.length);

  // 2. Database drillDetails
  const conn = await mysql.createConnection(DATABASE_URL);
  
  const [dbAll] = await conn.query('SELECT * FROM drillDetails');
  console.log('\n=== DATABASE (drillDetails) ===');
  console.log('Total:', dbAll.length);
  
  // Parse categories from DB
  const dbCats = {};
  let dbHitting = 0;
  let dbNonHitting = 0;
  dbAll.forEach(d => {
    let cats = [];
    try {
      cats = typeof d.categories === 'string' ? JSON.parse(d.categories) : (d.categories || []);
    } catch(e) { cats = []; }
    
    cats.forEach(c => { dbCats[c] = (dbCats[c] || 0) + 1; });
    
    if (cats.includes('Hitting')) {
      dbHitting++;
    } else {
      dbNonHitting++;
    }
  });
  console.log('Categories:', dbCats);
  console.log('Hitting:', dbHitting);
  console.log('Non-Hitting:', dbNonHitting);

  // 3. Check how the frontend merges them
  // Find drills in DB but not in JSON
  const jsonIds = new Set(drillsJson.map(d => d.id));
  const dbOnlyDrills = dbAll.filter(d => !jsonIds.has(d.drillId));
  console.log('\n=== DB-ONLY DRILLS (not in JSON) ===');
  console.log('Count:', dbOnlyDrills.length);
  dbOnlyDrills.forEach(d => {
    let cats = [];
    try { cats = typeof d.categories === 'string' ? JSON.parse(d.categories) : (d.categories || []); } catch(e) {}
    console.log(`  [${cats.join(', ')}] ${d.name || d.drillId} (ID: ${d.drillId})`);
  });

  // Find drills in JSON but not in DB
  const dbIds = new Set(dbAll.map(d => d.drillId));
  const jsonOnlyDrills = drillsJson.filter(d => !dbIds.has(d.id));
  console.log('\n=== JSON-ONLY DRILLS (not in DB) ===');
  console.log('Count:', jsonOnlyDrills.length);

  // 4. Check combined/merged drill count
  const allDrillIds = new Set([...drillsJson.map(d => d.id), ...dbAll.map(d => d.drillId)]);
  console.log('\n=== COMBINED UNIQUE DRILLS ===');
  console.log('Total unique drill IDs:', allDrillIds.size);
  
  // Count combined hitting
  const hittingIds = new Set();
  drillsJson.forEach(d => { if (d.categories.includes('Hitting')) hittingIds.add(d.id); });
  dbAll.forEach(d => {
    let cats = [];
    try { cats = typeof d.categories === 'string' ? JSON.parse(d.categories) : (d.categories || []); } catch(e) {}
    if (cats.includes('Hitting')) hittingIds.add(d.drillId);
  });
  console.log('Combined Hitting drills:', hittingIds.size);
  console.log('Combined Non-Hitting drills:', allDrillIds.size - hittingIds.size);

  // 5. Check supplementary JSON files
  console.log('\n=== SUPPLEMENTARY JSON FILES ===');
  const suppFiles = [
    'client/public/combined_drills.json',
    'client/public/drill_descriptions.json',
    'client/public/drill_goals.json',
    'client/public/generated_descriptions.json',
    'client/public/generated_goals.json',
    'client/public/generated_missing_goals.json',
    'client/public/parsed_descriptions.json',
    'client/public/parsed_goals.json',
  ];
  for (const f of suppFiles) {
    try {
      const data = JSON.parse(readFileSync(f, 'utf8'));
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      console.log(`  ${f}: ${count} entries`);
    } catch(e) {
      console.log(`  ${f}: ERROR - ${e.message}`);
    }
  }

  // 6. Check drillDetails schema
  const [cols] = await conn.query('DESCRIBE drillDetails');
  console.log('\n=== drillDetails SCHEMA ===');
  cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} ${c.Null === 'YES' ? '(nullable)' : ''}`));

  // 7. Check if there's a hidden/archived column already
  const hasHidden = cols.some(c => c.Field === 'hidden' || c.Field === 'archived' || c.Field === 'isHidden');
  console.log('\nHas hidden/archived column:', hasHidden);

  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
