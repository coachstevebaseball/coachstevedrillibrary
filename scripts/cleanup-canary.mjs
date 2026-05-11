import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

const TARGET_USER_IDS = ['107520474', '107520536'];

console.log('=== CANARY TEST ARTIFACT CLEANUP ===\n');

// 1. Audit target users
console.log('--- STEP 1: Audit target users ---');
const [users] = await conn.execute(
  `SELECT id, openId, name, email, role, isActiveClient, createdAt FROM users WHERE id IN (?, ?)`,
  TARGET_USER_IDS
);
console.log('Users to delete:');
users.forEach(u => console.log(`  id=${u.id} name="${u.name}" email="${u.email}" role=${u.role} active=${u.isActiveClient}`));

// 2. Audit invites
console.log('\n--- STEP 2: Audit invites ---');
const [invites] = await conn.execute(
  `SELECT id, email, role, status, acceptedByUserId FROM invites WHERE acceptedByUserId IN (?, ?) OR email IN ('steveng1364@gmail.com', 'stevenlewisrept@gmail.com')`,
  TARGET_USER_IDS
);
console.log(`Invites found: ${invites.length}`);
invites.forEach(i => console.log(`  invite id=${i.id} email="${i.email}" role=${i.role} status=${i.status} acceptedBy=${i.acceptedByUserId}`));

// 3. Audit drillAssignments
console.log('\n--- STEP 3: Audit drillAssignments ---');
const [assignments] = await conn.execute(
  `SELECT id, userId, drillId, status, completedAt FROM drillAssignments WHERE userId IN (?, ?)`,
  TARGET_USER_IDS
);
console.log(`Assignments found: ${assignments.length}`);
assignments.forEach(a => console.log(`  assignment id=${a.id} userId=${a.userId} drillId=${a.drillId} status=${a.status}`));

// 4. Audit related tables
const relatedTables = [
  { table: 'assignmentProgress', col: 'userId' },
  { table: 'athleteActivity', col: 'userId' },
  { table: 'pendingEmailAlerts', col: 'athleteId' },
  { table: 'hittingCoachUsage', col: 'userId' },
  { table: 'parentChild', col: 'parentId', extraCol: 'childId' },
  { table: 'notifications', col: 'userId' },
  { table: 'coachActivityLog', col: 'userId' },
  { table: 'coachNotes', col: 'userId' },
  { table: 'athleteProfiles', col: 'userId' },
  { table: 'weeklyGoals', col: 'userId' },
  { table: 'drillFavorites', col: 'userId' },
  { table: 'notificationPreferences', col: 'userId' },
  { table: 'emailNotificationLog', col: 'userId' },
];

console.log('\n--- STEP 4: Audit related tables ---');
for (const { table, col, extraCol } of relatedTables) {
  try {
    let query = `SELECT COUNT(*) as cnt FROM \`${table}\` WHERE \`${col}\` IN (?, ?)`;
    let params = [...TARGET_USER_IDS];
    if (extraCol) {
      query = `SELECT COUNT(*) as cnt FROM \`${table}\` WHERE \`${col}\` IN (?, ?) OR \`${extraCol}\` IN (?, ?)`;
      params = [...TARGET_USER_IDS, ...TARGET_USER_IDS];
    }
    const [rows] = await conn.execute(query, params);
    console.log(`  ${table}: ${rows[0].cnt} rows`);
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      console.log(`  ${table}: column ${col} not found, skipping`);
    } else {
      console.log(`  ${table}: error - ${e.message}`);
    }
  }
}

// === EXECUTE DELETES ===
console.log('\n\n=== EXECUTING DELETES ===\n');

// Delete from all related tables first (foreign key safety)
for (const { table, col, extraCol } of relatedTables) {
  try {
    let query = `DELETE FROM \`${table}\` WHERE \`${col}\` IN (?, ?)`;
    let params = [...TARGET_USER_IDS];
    if (extraCol) {
      query = `DELETE FROM \`${table}\` WHERE \`${col}\` IN (?, ?) OR \`${extraCol}\` IN (?, ?)`;
      params = [...TARGET_USER_IDS, ...TARGET_USER_IDS];
    }
    const [result] = await conn.execute(query, params);
    if (result.affectedRows > 0) console.log(`  Deleted ${result.affectedRows} from ${table}`);
  } catch (e) {
    if (e.code !== 'ER_BAD_FIELD_ERROR') {
      console.log(`  ${table}: error - ${e.message}`);
    }
  }
}

// Delete drillAssignments
const [dAssign] = await conn.execute(`DELETE FROM drillAssignments WHERE userId IN (?, ?)`, TARGET_USER_IDS);
console.log(`  Deleted ${dAssign.affectedRows} from drillAssignments`);

// Delete invites
const [dInv1] = await conn.execute(
  `DELETE FROM invites WHERE acceptedByUserId IN (?, ?) OR email IN ('steveng1364@gmail.com', 'stevenlewisrept@gmail.com')`,
  TARGET_USER_IDS
);
console.log(`  Deleted ${dInv1.affectedRows} from invites`);

// Delete users last
const [dUsers] = await conn.execute(`DELETE FROM users WHERE id IN (?, ?)`, TARGET_USER_IDS);
console.log(`  Deleted ${dUsers.affectedRows} from users`);

// === VERIFICATION ===
console.log('\n\n=== VERIFICATION ===\n');
const [remaining] = await conn.execute(`SELECT id, name, email FROM users WHERE id IN (?, ?)`, TARGET_USER_IDS);
console.log(`Users remaining with target IDs: ${remaining.length} (should be 0)`);

const [totalUsers] = await conn.execute(`SELECT COUNT(*) as cnt FROM users`);
console.log(`Total users remaining: ${totalUsers[0].cnt}`);

const [totalAssignments] = await conn.execute(`SELECT COUNT(*) as cnt FROM drillAssignments`);
console.log(`Total assignments remaining: ${totalAssignments[0].cnt}`);

const [totalInvites] = await conn.execute(`SELECT COUNT(*) as cnt FROM invites`);
console.log(`Total invites remaining: ${totalInvites[0].cnt}`);

// Show remaining users for dashboard verification
console.log('\n--- Remaining users (for dashboard check) ---');
const [allUsers] = await conn.execute(`SELECT id, name, email, role FROM users ORDER BY id`);
allUsers.forEach(u => console.log(`  id=${u.id} name="${u.name}" email="${u.email}" role=${u.role}`));

await conn.end();
console.log('\nCleanup complete.');
