/**
 * Drill filter options and type definitions.
 * Extracted from the legacy drills.ts static data file.
 * These constants are used by filter UIs across the app.
 */

export interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url: string;
  is_direct_link: boolean;
  ageLevel: string[];
  tags: string[];
  problem: string[];
  goal: string[];
  drillType: string;
  problems: string[];
  outcomes: string[];
}

export const filterOptions = {
  ageLevel: [
    { value: 'beginner-drills', label: 'Beginner Drills' },
    { value: 'intermediate-drills', label: 'Intermediate Drills' },
    { value: 'advanced-drills', label: 'Advanced Drills' },
    { value: 'pro-level-drills', label: 'Pro Level Drills' },
    { value: 'all', label: 'All Levels' },
  ],
  tags: [
    'foundation', 'bat speed', 'timing', 'lunging', 'bat path', 'rolling over',
    'stride focused', 'tee focus', 'two tee', 'hip hinge / side bend',
    'collapsing backside', 'pitching machine', 'variation training',
    'pitch recognition', 'vision', 'balance', 'swing mechanics', 'lower half', 'contact points',
  ],
  problem: [
    { value: 'add-more-power', label: 'Add More Power' },
    { value: 'anchored-or-stuck-on-back-side', label: 'Anchored or Stuck on Back Side' },
    { value: 'arm-barring', label: 'Arm Barring' },
    { value: 'balance-issues', label: 'Balance Issues' },
    { value: 'bat-drag-racing-back-elbow', label: 'Bat Drag / Racing Back Elbow' },
    { value: 'bat-path-issues', label: 'Bat Path Issues' },
    { value: 'bat-wrapping', label: 'Bat Wrapping' },
    { value: 'casting', label: 'Casting / Arm Bar' },
    { value: 'collapsing-back-side', label: 'Collapsing Back Side' },
    { value: 'early-extension', label: 'Early Extension' },
    { value: 'hands-dropping', label: 'Hands Dropping' },
    { value: 'head-drifting-forward-at-launch', label: 'Head Drifting Forward at Launch' },
    { value: 'improper-grip', label: 'Improper Grip' },
    { value: 'landing-with-locked-front-knee', label: 'Landing with Locked Front Knee' },
    { value: 'little-or-no-hip-rotation', label: 'Little or No Hip Rotation' },
    { value: 'little-or-no-weight-transfer', label: 'Little or No Weight Transfer' },
    { value: 'lunging', label: 'Lunging' },
    { value: 'no-coil-in-torso', label: 'No Coil in Torso' },
    { value: 'no-extension-getting-through-the-ball', label: 'No Extension Getting Through The Ball' },
    { value: 'no-hip-hinge', label: 'No Hip Hinge' },
    { value: 'no-hip-turn', label: 'No Hip Turn' },
    { value: 'no-rhythm', label: 'No Rhythm / Stiff' },
    { value: 'over-rotating-hips', label: 'Over Rotating Hips' },
    { value: 'poor-load', label: 'Poor Load' },
    { value: 'pulling-front-shoulder-head', label: 'Pulling Front Shoulder/Head' },
    { value: 'pushing-hands-to-the-ball', label: 'Pushing Hands to the Ball' },
    { value: 'reaching-with-front-foot', label: 'Reaching with Front Foot' },
    { value: 'rolling-over', label: 'Rolling Over' },
    { value: 'stride-to-open-stride-to-closed', label: 'Stride To Open / Stride To Closed' },
    { value: 'timing-issues', label: 'Timing Issues' },
    { value: 'too-tall-throughout-swing', label: 'Too Tall Throughout Swing' },
    { value: 'twisting-shoulders', label: 'Twisting Shoulders' },
    { value: 'uppercut', label: 'Uppercut / Chop' },
    { value: 'weak-contact', label: 'Weak Contact' },
    { value: 'weight-goes-back-during-load', label: 'Weight Goes Back During Load' },
  ],
  goal: [
    { value: 'up-exit-velocity', label: 'Up Exit Velocity' },
    { value: 'improve-barrel-path', label: 'Improve Barrel Path' },
    { value: 'improve-contact-quality', label: 'Improve Contact Quality' },
    { value: 'decision-making', label: 'Decision Making' },
    { value: 'increase-bat-speed', label: 'Increase Bat Speed' },
    { value: 'game-transfer', label: 'Game Transfer' },
    { value: 'load', label: 'Load Mechanics' },
    { value: 'lower-half', label: 'Lower Half / Rotation' },
    { value: 'swing-mechanics', label: 'Swing Mechanics' },
    { value: 'pitch-recognition', label: 'Improve Pitch Recognition' },
    { value: 'plate-coverage', label: 'Plate Coverage' },
    { value: 'power', label: 'Increase Power' },
    { value: 'improve-rhythm-timing', label: 'Improve Rhythm & Timing' },
  ],
  // New canonical tag lists
  problems: [
    'Timing Issues', 'Bat Path Issues', 'Poor Load', 'Lunging', 'Collapsing Backside',
    'Weak Contact', 'No Hip Rotation', 'Early Extension', 'Rolling Over', 'Arm Barring',
    'Head Drifting', 'Pushing Hands', 'No Extension', 'Balance Issues', 'Improper Grip',
    'Twisting Shoulders', 'No Rhythm', 'Bat Drag',
  ],
  outcomes: [
    'Improve Barrel Path', 'Improve Timing', 'Increase Bat Speed', 'Improve Swing Mechanics',
    'Build Lower Half', 'Better Contact Quality', 'Add Power', 'Improve Load',
    'Pitch Recognition', 'Decision Making', 'Plate Coverage', 'Game Transfer',
  ],
};

export const drillTypeOptions = [
  {
    label: 'Foundational',
    options: [
      { value: 'Tee Work', label: 'Tee Work' },
      { value: 'Soft Toss', label: 'Soft Toss' },
      { value: 'Front Toss', label: 'Front Toss' },
      { value: 'Machine', label: 'Machine' },
      { value: 'Live BP', label: 'Live BP' },
      { value: 'Flaw Fix', label: 'Flaw Fix' },
    ],
  },
  {
    label: 'Mechanics',
    options: [
      { value: 'Load and Stride', label: 'Load and Stride' },
      { value: 'Timing Drill', label: 'Timing Drill' },
      { value: 'Balance Drill', label: 'Balance Drill' },
      { value: 'Separation Drill', label: 'Separation Drill' },
      { value: 'Bat Path', label: 'Bat Path' },
      { value: 'Contact Point', label: 'Contact Point' },
    ],
  },
  {
    label: 'Tee Variations',
    options: [
      { value: 'High Tee', label: 'High Tee' },
      { value: 'Low Tee', label: 'Low Tee' },
      { value: 'Inside Tee', label: 'Inside Tee' },
      { value: 'Outside Tee', label: 'Outside Tee' },
      { value: 'Opposite Field', label: 'Opposite Field' },
      { value: 'Pull Side', label: 'Pull Side' },
    ],
  },
  {
    label: 'Approach',
    options: [
      { value: 'Middle Approach', label: 'Middle Approach' },
      { value: 'Situational Hitting', label: 'Situational Hitting' },
      { value: 'Two Strike Approach', label: 'Two Strike Approach' },
      { value: 'Variation Training', label: 'Variation Training' },
    ],
  },
  {
    label: 'Recognition',
    options: [
      { value: 'Pitch Recognition', label: 'Pitch Recognition' },
      { value: 'Zone Recognition', label: 'Zone Recognition' },
      { value: 'Tracking', label: 'Tracking' },
      { value: 'Decision Making', label: 'Decision Making' },
    ],
  },
  {
    label: 'Game Speed',
    options: [
      { value: 'Velocity Training', label: 'Velocity Training' },
      { value: 'Breaking Ball Recognition', label: 'Breaking Ball Recognition' },
      { value: 'High Velocity Machine', label: 'High Velocity Machine' },
      { value: 'Game Simulation', label: 'Game Simulation' },
    ],
  },
];
