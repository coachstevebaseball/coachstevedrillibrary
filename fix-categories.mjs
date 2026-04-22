import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const m = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({
  host: m[3], port: +m[4], user: m[1], password: m[2], database: m[5],
  ssl: { rejectUnauthorized: false }
});

// Step 1: Cross-reference with drillDetails.skillSet for ground truth
const [allDrills] = await conn.execute("SELECT drillId, name, categories, difficulty, source FROM drills ORDER BY drillId");
const [allDetails] = await conn.execute("SELECT drillId, skillSet, goal FROM drillDetails");

const detailMap = {};
for (const dd of allDetails) {
  detailMap[dd.drillId] = dd;
}

const fixes = [];

for (const d of allDrills) {
  const id = d.drillId.toLowerCase();
  let cats;
  try { cats = JSON.parse(d.categories || '[]'); } catch { cats = [d.categories]; }
  const currentCat = cats[0] || 'Unknown';
  const dd = detailMap[d.drillId];
  const ddSkill = dd ? dd.skillSet : null;
  const ddGoal = dd ? (dd.goal || '').toLowerCase() : '';
  
  let correctCat = null;
  
  // Trust drillDetails.skillSet if it's specific (not "Custom")
  if (ddSkill && ddSkill !== 'Custom' && ddSkill !== currentCat) {
    correctCat = ddSkill;
  }
  
  // For "Custom" skillSet or no details, infer from drillId + goal
  if (!correctCat && currentCat === 'Hitting') {
    // Pitching drills
    if (id.includes('flat-ground') || id.includes('set-position') || id.includes('working-in-set') ||
        id.includes('arm-path') || id.includes('arm-speed') || id.includes('balance-drill') ||
        id.includes('balanced-stationary-drill') && !id.includes('upper-body') ||
        id.includes('break-of-the-hands') || id.includes('hand-break') ||
        id.includes('lincecum') || id.includes('power-position') || id.includes('show-knuckles') ||
        id.includes('stride-to-spot') || id.includes('change-up-grips')) {
      if (ddGoal.includes('pitch') || ddGoal.includes('mound') || ddGoal.includes('arm') ||
          ddGoal.includes('delivery') || ddGoal.includes('throw') || ddGoal.includes('release') ||
          ddGoal.includes('balance') || ddGoal.includes('stride') || ddGoal.includes('grip')) {
        correctCat = 'Pitching';
      }
    }
    
    // Throwing drills
    if (id.includes('long-toss') || id.includes('crow-hop') || id.includes('tandem') ||
        id.includes('squared-throwing') || id.includes('upper-body-throwing') ||
        id.includes('daily-band-work') || id.includes('interval-throwing') ||
        id.includes('intentional-throwing') || id.includes('daily-throwing') ||
        id.includes('daily-flat-ground-work') || id.includes('one-knee-drill')) {
      if (ddGoal.includes('throw') || ddGoal.includes('arm') || ddGoal.includes('warm') ||
          ddGoal.includes('strength') || ddGoal.includes('band') || ddGoal.includes('mechanic') ||
          !ddGoal.includes('hit') && !ddGoal.includes('bat') && !ddGoal.includes('swing')) {
        correctCat = 'Throwing';
      }
    }
    
    // Bunting drills
    if (id.includes('bunt') || id.includes('drag-bunt') || id.includes('push-bunt') ||
        id.includes('sacrifice-bunt') || id.includes('safety-squeeze') || id.includes('team-bunting') ||
        id.includes('short-base-team-bunt')) {
      correctCat = 'Bunting';
    }
    
    // Outfield drills
    if (id.includes('outfield') || id.includes('fly-ball') || id.includes('fly-balls') ||
        id.includes('rainbow-route') || id.includes('one-cut') ||
        id.includes('quarterback') || id.includes('drop-step-cone') ||
        id.includes('read-and-react') || id.includes('speed-square')) {
      correctCat = 'Outfield';
    }
    
    // Infield drills
    if (id.includes('grounder') || id.includes('short-hop') || id.includes('running-short-hop') ||
        id.includes('defense-stance') || id.includes('double-ball-toss')) {
      correctCat = 'Infield';
    }
  }
  
  if (correctCat && correctCat !== currentCat) {
    fixes.push({ drillId: d.drillId, from: currentCat, to: correctCat, reason: ddSkill ? `drillDetails.skillSet=${ddSkill}` : 'inferred from drillId+goal' });
  }
}

console.log(`\nCategory fixes needed: ${fixes.length}`);
fixes.forEach(f => console.log(`  ${f.drillId}: ${f.from} → ${f.to} (${f.reason})`));

// Apply fixes
let fixed = 0;
for (const f of fixes) {
  await conn.execute(
    "UPDATE drills SET categories = ? WHERE drillId = ?",
    [JSON.stringify([f.to]), f.drillId]
  );
  fixed++;
}
console.log(`\n✓ Applied ${fixed} category fixes`);

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
