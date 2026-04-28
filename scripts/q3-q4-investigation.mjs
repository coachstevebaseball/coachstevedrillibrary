import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/usab-drills-directory/.env' });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Q3: Full schema of users table
console.log("=== Q3: USERS TABLE SCHEMA (DESCRIBE) ===");
const [schema] = await conn.execute("DESCRIBE users");
console.table(schema);

// Q3: One anonymized sample row (all columns)
console.log("\n=== Q3: SAMPLE ROW (all columns, first athlete) ===");
const [sample] = await conn.execute(
  "SELECT * FROM users WHERE role = 'athlete' LIMIT 1"
);
if (sample.length > 0) {
  const row = { ...sample[0] };
  // Anonymize PII
  row.name = "REDACTED_NAME";
  row.email = "REDACTED@example.com";
  row.openId = "REDACTED_OPENID";
  row.emailVerificationToken = row.emailVerificationToken ? "REDACTED_TOKEN" : null;
  console.log(JSON.stringify(row, null, 2));
}

// Q4: Distinct users who have ever made an authenticated request
// Evidence 1: lastSignedIn vs createdAt
console.log("\n=== Q4: USERS WITH lastSignedIn > createdAt + 1 minute (evidence of re-authentication) ===");
const [reauth] = await conn.execute(`
  SELECT id, 
         'REDACTED' as name,
         loginMethod, 
         role,
         lastSignedIn, 
         createdAt,
         TIMESTAMPDIFF(MINUTE, createdAt, lastSignedIn) as minutes_between
  FROM users 
  WHERE TIMESTAMPDIFF(MINUTE, createdAt, lastSignedIn) > 1
  ORDER BY lastSignedIn DESC
`);
console.table(reauth);
console.log(`Distinct users who re-authenticated: ${reauth.length}`);

// Evidence 2: Check if there are any session-related tables
console.log("\n=== Q4: ALL TABLES IN DATABASE ===");
const [tables] = await conn.execute("SHOW TABLES");
console.table(tables);

// Evidence 3: Check drill assignments with userId set (proves authenticated interaction)
console.log("\n=== Q4: DRILL ASSIGNMENTS WITH userId SET (proves authenticated API calls) ===");
const [assignments] = await conn.execute(`
  SELECT DISTINCT userId, COUNT(*) as assignment_count
  FROM drillAssignments 
  WHERE userId IS NOT NULL
  GROUP BY userId
`);
console.table(assignments);
console.log(`Distinct users with drill assignments: ${assignments.length}`);

// Evidence 4: Assignment progress entries (proves authenticated POST requests)
console.log("\n=== Q4: ASSIGNMENT PROGRESS ENTRIES (proves authenticated mutations) ===");
const [progress] = await conn.execute(`
  SELECT DISTINCT userId, COUNT(*) as progress_entries
  FROM assignmentProgress
  GROUP BY userId
`);
console.table(progress);
console.log(`Distinct users who recorded progress: ${progress.length}`);

// Evidence 5: Activity log
console.log("\n=== Q4: ACTIVITY LOG ENTRIES ===");
const [activityCount] = await conn.execute(`
  SELECT COUNT(*) as total FROM activityLog
`);
console.log(`Total activity log entries: ${activityCount[0].total}`);

const [activityUsers] = await conn.execute(`
  SELECT DISTINCT userId, COUNT(*) as actions
  FROM activityLog
  WHERE userId IS NOT NULL
  GROUP BY userId
`);
console.table(activityUsers);
console.log(`Distinct users in activity log: ${activityUsers.length}`);

// Evidence 6: Hitting coach usage
console.log("\n=== Q4: HITTING COACH USAGE ===");
const [hcUsage] = await conn.execute(`
  SELECT DISTINCT userId, SUM(messageCount) as total_messages
  FROM hittingCoachUsage
  GROUP BY userId
`);
console.table(hcUsage);
console.log(`Distinct users who used hitting coach: ${hcUsage.length}`);

// Evidence 7: Notifications
console.log("\n=== Q4: NOTIFICATIONS (proves server sent to authenticated users) ===");
const [notifCount] = await conn.execute(`
  SELECT DISTINCT userId, COUNT(*) as notifications
  FROM notifications
  WHERE userId IS NOT NULL
  GROUP BY userId
`);
console.table(notifCount);
console.log(`Distinct users who received notifications: ${notifCount.length}`);

await conn.end();
