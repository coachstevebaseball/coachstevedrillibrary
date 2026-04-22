/**
 * Idempotent migration: Consolidate dual tag systems.
 * 
 * For drills that have legacy problem/goal (slug-based) but empty problems/outcomes
 * (display-label-based), map the slugs to their display labels and populate
 * problems/outcomes.
 * 
 * For drills that already have both, ensure problems/outcomes is the superset.
 * 
 * The legacy columns (problem, goal) are kept as-is for backward compatibility
 * but the filter UI will be updated to prefer problems/outcomes.
 */
import m from 'mysql2/promise';

const conn = await m.createConnection(process.env.DATABASE_URL);

// Mapping from legacy slug → display label
const problemSlugToLabel = {
  'add-more-power': 'Add Power',
  'anchored-or-stuck-on-back-side': 'Collapsing Backside',
  'arm-barring': 'Arm Barring',
  'balance-issues': 'Balance Issues',
  'bat-drag-racing-back-elbow': 'Bat Drag',
  'bat-path-issues': 'Bat Path Issues',
  'bat-wrapping': 'Bat Drag',
  'casting': 'Arm Barring',
  'collapsing-back-side': 'Collapsing Backside',
  'early-extension': 'Early Extension',
  'hands-dropping': 'Pushing Hands',
  'head-drifting-forward-at-launch': 'Head Drifting',
  'improper-grip': 'Improper Grip',
  'landing-with-locked-front-knee': 'Balance Issues',
  'little-or-no-hip-rotation': 'No Hip Rotation',
  'little-or-no-weight-transfer': 'Weak Contact',
  'lunging': 'Lunging',
  'no-coil-in-torso': 'No Hip Rotation',
  'no-extension-getting-through-the-ball': 'No Extension',
  'no-hip-hinge': 'No Hip Rotation',
  'no-hip-turn': 'No Hip Rotation',
  'no-rhythm': 'No Rhythm',
  'over-rotating-hips': 'No Hip Rotation',
  'poor-load': 'Poor Load',
  'pulling-front-shoulder-head': 'Twisting Shoulders',
  'pushing-hands-to-the-ball': 'Pushing Hands',
  'reaching-with-front-foot': 'Lunging',
  'rolling-over': 'Rolling Over',
  'stride-to-open-stride-to-closed': 'Balance Issues',
  'timing-issues': 'Timing Issues',
  'too-tall-throughout-swing': 'Balance Issues',
  'twisting-shoulders': 'Twisting Shoulders',
  'uppercut': 'Bat Path Issues',
  'weak-contact': 'Weak Contact',
  'weight-goes-back-during-load': 'Poor Load',
};

const goalSlugToLabel = {
  'up-exit-velocity': 'Add Power',
  'improve-barrel-path': 'Improve Barrel Path',
  'improve-contact-quality': 'Better Contact Quality',
  'decision-making': 'Decision Making',
  'increase-bat-speed': 'Increase Bat Speed',
  'game-transfer': 'Game Transfer',
  'load': 'Improve Load',
  'lower-half': 'Build Lower Half',
  'swing-mechanics': 'Improve Swing Mechanics',
  'pitch-recognition': 'Pitch Recognition',
  'plate-coverage': 'Plate Coverage',
  'power': 'Add Power',
  'improve-rhythm-timing': 'Improve Timing',
};

// Get all drills
const [allDrills] = await conn.query('SELECT id, drillId, problem, goal, problems, outcomes FROM drills');

let updated = 0;
let skipped = 0;

for (const drill of allDrills) {
  const legacyProblem = Array.isArray(drill.problem) ? drill.problem : [];
  const legacyGoal = Array.isArray(drill.goal) ? drill.goal : [];
  const existingProblems = Array.isArray(drill.problems) ? drill.problems : [];
  const existingOutcomes = Array.isArray(drill.outcomes) ? drill.outcomes : [];

  // Map legacy slugs to display labels
  const mappedProblems = legacyProblem
    .map(slug => problemSlugToLabel[slug])
    .filter(Boolean);
  const mappedOutcomes = legacyGoal
    .map(slug => goalSlugToLabel[slug])
    .filter(Boolean);

  // Merge: existing canonical + mapped legacy, deduplicated
  const mergedProblems = [...new Set([...existingProblems, ...mappedProblems])];
  const mergedOutcomes = [...new Set([...existingOutcomes, ...mappedOutcomes])];

  // Only update if there's a change
  const problemsChanged = JSON.stringify(mergedProblems) !== JSON.stringify(existingProblems);
  const outcomesChanged = JSON.stringify(mergedOutcomes) !== JSON.stringify(existingOutcomes);

  if (problemsChanged || outcomesChanged) {
    await conn.query(
      'UPDATE drills SET problems = ?, outcomes = ? WHERE id = ?',
      [JSON.stringify(mergedProblems), JSON.stringify(mergedOutcomes), drill.id]
    );
    updated++;
  } else {
    skipped++;
  }
}

console.log(`Tag consolidation complete: ${updated} drills updated, ${skipped} unchanged.`);

// Verify
const [stats] = await conn.query(`
  SELECT 
    SUM(CASE WHEN problems IS NOT NULL AND JSON_LENGTH(problems) > 0 THEN 1 ELSE 0 END) as has_problems,
    SUM(CASE WHEN outcomes IS NOT NULL AND JSON_LENGTH(outcomes) > 0 THEN 1 ELSE 0 END) as has_outcomes,
    COUNT(*) as total
  FROM drills
`);
console.log('Post-merge coverage:', stats[0]);

await conn.end();
