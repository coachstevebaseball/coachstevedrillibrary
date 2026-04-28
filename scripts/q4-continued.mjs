import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/usab-drills-directory/.env' });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Hitting coach usage
console.log("=== HITTING COACH USAGE ===");
try {
  const [hcUsage] = await conn.execute(`
    SELECT DISTINCT userId, SUM(messageCount) as total_messages
    FROM hittingCoachUsage
    GROUP BY userId
  `);
  console.table(hcUsage);
  console.log(`Distinct users who used hitting coach: ${hcUsage.length}`);
} catch(e) { console.log("hittingCoachUsage table not found or empty"); }

// Notifications
console.log("\n=== NOTIFICATIONS ===");
try {
  const [notifCount] = await conn.execute(`
    SELECT DISTINCT userId, COUNT(*) as notifications
    FROM notifications
    WHERE userId IS NOT NULL
    GROUP BY userId
  `);
  console.table(notifCount);
  console.log(`Distinct users who received notifications: ${notifCount.length}`);
} catch(e) { console.log("notifications table error:", e.message); }

// Coach activity log (different table name)
console.log("\n=== COACH ACTIVITY LOG ===");
try {
  const [coachLog] = await conn.execute(`
    SELECT COUNT(*) as total FROM coachActivityLog
  `);
  console.log(`Total coach activity log entries: ${coachLog[0].total}`);
} catch(e) { console.log("coachActivityLog error:", e.message); }

// Athlete activity
console.log("\n=== ATHLETE ACTIVITY ===");
try {
  const [athleteAct] = await conn.execute(`
    SELECT DISTINCT userId, COUNT(*) as actions
    FROM athleteActivity
    WHERE userId IS NOT NULL
    GROUP BY userId
  `);
  console.table(athleteAct);
  console.log(`Distinct athletes with activity: ${athleteAct.length}`);
} catch(e) { console.log("athleteActivity error:", e.message); }

// Session notes (proves coach made authenticated writes)
console.log("\n=== SESSION NOTES ===");
try {
  const [notes] = await conn.execute(`
    SELECT COUNT(*) as total FROM sessionNotes
  `);
  console.log(`Total session notes: ${notes[0].total}`);
} catch(e) { console.log("sessionNotes error:", e.message); }

// All users with their login methods and last sign-in
console.log("\n=== ALL USERS SUMMARY ===");
const [allUsers] = await conn.execute(`
  SELECT id, loginMethod, role, isActiveClient, lastSignedIn, createdAt,
         TIMESTAMPDIFF(DAY, createdAt, lastSignedIn) as days_active
  FROM users
  ORDER BY lastSignedIn DESC
`);
console.table(allUsers);
console.log(`Total users: ${allUsers.length}`);

// Count by login method
console.log("\n=== LOGIN METHOD BREAKDOWN ===");
const [methods] = await conn.execute(`
  SELECT loginMethod, COUNT(*) as count
  FROM users
  GROUP BY loginMethod
`);
console.table(methods);

// Invites table
console.log("\n=== INVITES STATUS ===");
try {
  const [invites] = await conn.execute(`
    SELECT status, COUNT(*) as count
    FROM invites
    GROUP BY status
  `);
  console.table(invites);
} catch(e) { console.log("invites error:", e.message); }

// Check what the accepted invites look like
console.log("\n=== ACCEPTED INVITES ===");
try {
  const [accepted] = await conn.execute(`
    SELECT id, role, status, acceptedAt, createdAt
    FROM invites
    WHERE status = 'accepted'
    ORDER BY acceptedAt DESC
    LIMIT 5
  `);
  console.table(accepted);
} catch(e) { console.log("invites error:", e.message); }

await conn.end();
