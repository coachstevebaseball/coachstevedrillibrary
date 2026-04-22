import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const m2 = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({
  host: m2[3], port: +m2[4], user: m2[1], password: m2[2], database: m2[5],
  ssl: { rejectUnauthorized: false }
});

// Manual overrides based on drillId content analysis
// These drills are tagged "Hitting" in drillDetails but are clearly something else
const manualFixes = {
  // Throwing drills
  'crow-hops': 'Throwing',
  'daily-band-work': 'Throwing',
  'daily-flat-ground-work': 'Throwing',
  'daily-throwing-program': 'Throwing',
  'intentional-throwing': 'Throwing',
  'interval-throwing': 'Throwing',
  'long-toss': 'Throwing',
  'one-knee-drill': 'Throwing',
  'squared-throwing': 'Throwing',
  'tandem': 'Throwing',
  'upper-body-throwing': 'Throwing',
  
  // Pitching drills
  'balance-pause-drill': 'Pitching',
  'arm-path-drill': 'Pitching',
  'arm-speed': 'Pitching',
  'balance-drill': 'Pitching',
  'balanced-stationary-drill': 'Pitching',
  'break-of-the-hands-drill': 'Pitching',
  'change-up-grips': 'Pitching',
  'flat-ground': 'Pitching',
  'hand-break-drill': 'Pitching',
  'lincecum-drill': 'Pitching',
  'power-position': 'Pitching',
  'show-knuckles-drill': 'Pitching',
  'stride-to-spot': 'Pitching',
  'working-in-set-position': 'Pitching',
  
  // Bunting drills
  'drag-bunt': 'Bunting',
  'push-bunt': 'Bunting',
  'sacrifice-bunt': 'Bunting',
  'safety-squeeze-bunt': 'Bunting',
  'short-base-team-bunt-drill': 'Bunting',
  'team-bunting-stations': 'Bunting',
  
  // Outfield drills
  'fly-balls': 'Outfield',
  'outfield-groundballs': 'Outfield',
  'quarterback-adjustments': 'Outfield',
  'quarterback-angle-throw': 'Outfield',
  'quarterback-over-the-shoulder': 'Outfield',
  'rainbow-route': 'Outfield',
  'read-and-react': 'Outfield',
  'speed-square': 'Outfield',
  'drop-step-cones': 'Outfield',
  'one-cut-competition': 'Outfield',
  
  // Infield drills
  'grounders': 'Infield',
  'short-hops': 'Infield',
  'running-short-hops': 'Infield',
  'defense-stance': 'Infield',
  'double-ball-toss': 'Infield',
  'heavy-front-side-drill': 'Infield',
  
  // Fix trailing space
  'Hitting ': null, // Will fix below
};

let fixed = 0;
for (const [drillId, newCat] of Object.entries(manualFixes)) {
  if (!newCat) continue;
  const [result] = await conn.execute(
    "UPDATE drills SET categories = ? WHERE drillId = ?",
    [JSON.stringify([newCat]), drillId]
  );
  if (result.affectedRows > 0) {
    console.log(`  ${drillId}: → ${newCat}`);
    fixed++;
  }
}

// Fix the "Hitting " with trailing space
await conn.execute("UPDATE drills SET categories = ? WHERE categories = ?", [JSON.stringify(['Hitting']), 'Hitting ']);
console.log('  Fixed trailing space in "Hitting " category');

console.log(`\n✓ Applied ${fixed} manual category fixes`);

// Category distribution after fix
const [catDist] = await conn.execute("SELECT categories, COUNT(*) as cnt FROM drills WHERE isHidden = 0 GROUP BY categories ORDER BY cnt DESC");
console.log('\nCategory distribution (visible drills):');
catDist.forEach(r => {
  let cat;
  try { cat = JSON.parse(r.categories || '[]')[0] || 'Unknown'; } catch { cat = r.categories || 'Unknown'; }
  console.log(`  ${cat}: ${r.cnt}`);
});

const [total] = await conn.execute("SELECT COUNT(*) as cnt FROM drills");
const [visible] = await conn.execute("SELECT COUNT(*) as cnt FROM drills WHERE isHidden = 0");
console.log(`\nTotal: ${total[0].cnt} | Visible: ${visible[0].cnt}`);

await conn.end();
