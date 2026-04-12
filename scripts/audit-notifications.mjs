import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  console.log("\n========================================");
  console.log("  USER / ATHLETE NOTIFICATION AUDIT");
  console.log("========================================\n");

  // 1. All users
  console.log("── 1. ALL USERS ──────────────────────────────────────────");
  const [users] = await conn.query(`
    SELECT id, openId, name, email, role, isActiveClient, emailVerified, sentWelcomeEmail, createdAt
    FROM users
    ORDER BY id
  `);
  console.table(users.map(u => ({
    ID: u.id,
    Name: u.name || '(none)',
    Email: u.email || '(none)',
    Role: u.role,
    Active: u.isActiveClient ? 'YES' : 'NO',
    EmailVerified: u.emailVerified ? 'YES' : 'NO',
    WelcomeEmail: u.sentWelcomeEmail ? 'YES' : 'NO',
  })));
  console.log(`Total users: ${users.length}\n`);

  // 2. Users missing email
  const usersNoEmail = users.filter(u => !u.email);
  if (usersNoEmail.length > 0) {
    console.log("⚠️  USERS MISSING EMAIL:");
    console.table(usersNoEmail.map(u => ({ ID: u.id, Name: u.name, Role: u.role })));
  } else {
    console.log("✅ All users have email addresses.\n");
  }

  // 3. Notification counts per user
  console.log("── 2. NOTIFICATIONS PER USER ──────────────────────────────");
  const [notifCounts] = await conn.query(`
    SELECT 
      n.userId,
      u.name,
      u.email,
      u.role,
      COUNT(*) as totalNotifications,
      SUM(CASE WHEN n.portalStatus = 'unread' THEN 1 ELSE 0 END) as unread,
      SUM(CASE WHEN n.portalStatus = 'read' THEN 1 ELSE 0 END) as readCount,
      SUM(CASE WHEN n.emailStatus = 'sent' THEN 1 ELSE 0 END) as emailsSent,
      SUM(CASE WHEN n.emailStatus = 'failed' THEN 1 ELSE 0 END) as emailsFailed,
      SUM(CASE WHEN n.emailStatus = 'pending' THEN 1 ELSE 0 END) as emailsPending,
      SUM(CASE WHEN n.emailStatus = 'queued' THEN 1 ELSE 0 END) as emailsQueued
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    GROUP BY n.userId, u.name, u.email, u.role
    ORDER BY n.userId
  `);
  console.table(notifCounts.map(r => ({
    UserID: r.userId,
    Name: r.name || '(none)',
    Email: r.email || '(none)',
    Role: r.role || '(ORPHANED)',
    Total: r.totalNotifications,
    Unread: r.unread,
    Read: r.readCount,
    EmailSent: r.emailsSent,
    EmailFailed: r.emailsFailed,
    EmailPending: r.emailsPending,
    EmailQueued: r.emailsQueued,
  })));

  // 4. Orphaned notifications (userId doesn't match any user)
  console.log("\n── 3. ORPHANED NOTIFICATIONS ──────────────────────────────");
  const [orphaned] = await conn.query(`
    SELECT n.id, n.userId, n.type, n.title, n.emailStatus, n.portalStatus, n.createdAt
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    WHERE u.id IS NULL
    ORDER BY n.id
  `);
  if (orphaned.length > 0) {
    console.log(`⚠️  ${orphaned.length} ORPHANED NOTIFICATIONS (userId doesn't match any user):`);
    console.table(orphaned.map(n => ({
      NotifID: n.id,
      UserID: n.userId,
      Type: n.type,
      Title: n.title,
      EmailStatus: n.emailStatus,
      PortalStatus: n.portalStatus,
    })));
  } else {
    console.log("✅ No orphaned notifications found.\n");
  }

  // 5. Notification preferences
  console.log("── 4. NOTIFICATION PREFERENCES ──────────────────────────────");
  const [prefs] = await conn.query(`
    SELECT np.userId, u.name, u.email, u.role, np.emailNotifications,
           np.drillAssignments, np.notesUpdates, np.recapUpdates, np.swingAnalysis,
           np.feedbackUpdates, np.submissionUpdates, np.badgeUpdates, np.practicePlanUpdates,
           np.systemUpdates
    FROM notificationPreferences np
    LEFT JOIN users u ON np.userId = u.id
    ORDER BY np.userId
  `);
  if (prefs.length > 0) {
    console.table(prefs.map(p => ({
      UserID: p.userId,
      Name: p.name || '(none)',
      Role: p.role || '(ORPHANED)',
      EmailMaster: p.emailNotifications ? 'ON' : 'OFF',
      Drills: p.drillAssignments ? 'ON' : 'OFF',
      Notes: p.notesUpdates ? 'ON' : 'OFF',
      Recaps: p.recapUpdates ? 'ON' : 'OFF',
      Swing: p.swingAnalysis ? 'ON' : 'OFF',
      Feedback: p.feedbackUpdates ? 'ON' : 'OFF',
      Submissions: p.submissionUpdates ? 'ON' : 'OFF',
      Badges: p.badgeUpdates ? 'ON' : 'OFF',
      Plans: p.practicePlanUpdates ? 'ON' : 'OFF',
      System: p.systemUpdates ? 'ON' : 'OFF',
    })));
  } else {
    console.log("ℹ️  No notification preferences set yet (defaults will apply).\n");
  }

  // 6. Users WITHOUT notification preferences
  const [usersNoPrefs] = await conn.query(`
    SELECT u.id, u.name, u.email, u.role
    FROM users u
    LEFT JOIN notificationPreferences np ON u.id = np.userId
    WHERE np.id IS NULL
    ORDER BY u.id
  `);
  if (usersNoPrefs.length > 0) {
    console.log(`\nℹ️  ${usersNoPrefs.length} users have no notification preferences (will use defaults):`);
    console.table(usersNoPrefs.map(u => ({
      UserID: u.id,
      Name: u.name || '(none)',
      Email: u.email || '(none)',
      Role: u.role,
    })));
  }

  // 7. Recent notifications (last 20)
  console.log("\n── 5. RECENT NOTIFICATIONS (last 20) ──────────────────────");
  const [recent] = await conn.query(`
    SELECT n.id, n.userId, u.name, u.email, n.type, n.title, n.emailStatus, n.portalStatus, 
           n.recipientEmail, n.createdAt, n.sentAt
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    ORDER BY n.createdAt DESC
    LIMIT 20
  `);
  console.table(recent.map(n => ({
    ID: n.id,
    UserID: n.userId,
    Name: n.name || '(none)',
    UserEmail: n.email || '(none)',
    RecipientEmail: n.recipientEmail || '(none)',
    Type: n.type,
    Title: n.title?.substring(0, 40),
    EmailStatus: n.emailStatus,
    PortalStatus: n.portalStatus,
    Created: n.createdAt ? new Date(n.createdAt).toISOString().slice(0, 16) : '',
    Sent: n.sentAt ? new Date(n.sentAt).toISOString().slice(0, 16) : '',
  })));

  // 8. Email mismatch check
  console.log("\n── 6. EMAIL MISMATCH CHECK ──────────────────────────────");
  const [mismatches] = await conn.query(`
    SELECT n.id, n.userId, u.email as userEmail, n.recipientEmail, n.type, n.title
    FROM notifications n
    JOIN users u ON n.userId = u.id
    WHERE n.recipientEmail IS NOT NULL 
      AND n.recipientEmail != '' 
      AND u.email IS NOT NULL 
      AND u.email != ''
      AND n.recipientEmail != u.email
    ORDER BY n.id DESC
    LIMIT 20
  `);
  if (mismatches.length > 0) {
    console.log(`⚠️  ${mismatches.length} notifications have mismatched emails:`);
    console.table(mismatches.map(m => ({
      NotifID: m.id,
      UserID: m.userId,
      UserEmail: m.userEmail,
      RecipientEmail: m.recipientEmail,
      Type: m.type,
    })));
  } else {
    console.log("✅ No email mismatches found.\n");
  }

  // 9. Failed email notifications
  console.log("── 7. FAILED EMAIL NOTIFICATIONS ──────────────────────────");
  const [failed] = await conn.query(`
    SELECT n.id, n.userId, u.name, u.email, n.type, n.title, n.lastError, n.retryCount, n.createdAt
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    WHERE n.emailStatus = 'failed'
    ORDER BY n.createdAt DESC
    LIMIT 20
  `);
  if (failed.length > 0) {
    console.log(`⚠️  ${failed.length} failed email notifications:`);
    console.table(failed.map(f => ({
      ID: f.id,
      UserID: f.userId,
      Name: f.name || '(none)',
      Email: f.email || '(none)',
      Type: f.type,
      Title: f.title?.substring(0, 30),
      Error: f.lastError?.substring(0, 50) || '',
      Retries: f.retryCount,
    })));
  } else {
    console.log("✅ No failed email notifications.\n");
  }

  // Summary
  const [totalNotifs] = await conn.query(`SELECT COUNT(*) as cnt FROM notifications`);
  const [totalSent] = await conn.query(`SELECT COUNT(*) as cnt FROM notifications WHERE emailStatus = 'sent'`);
  const [totalFailed] = await conn.query(`SELECT COUNT(*) as cnt FROM notifications WHERE emailStatus = 'failed'`);
  const [totalPending] = await conn.query(`SELECT COUNT(*) as cnt FROM notifications WHERE emailStatus = 'pending'`);

  console.log("\n========================================");
  console.log("  SUMMARY");
  console.log("========================================");
  console.log(`Total users:              ${users.length}`);
  console.log(`Users missing email:      ${usersNoEmail.length}`);
  console.log(`Total notifications:      ${totalNotifs[0].cnt}`);
  console.log(`Emails sent:              ${totalSent[0].cnt}`);
  console.log(`Emails failed:            ${totalFailed[0].cnt}`);
  console.log(`Emails pending:           ${totalPending[0].cnt}`);
  console.log(`Orphaned notifications:   ${orphaned.length}`);
  console.log(`Email mismatches:         ${mismatches.length}`);
  console.log(`Users w/o preferences:    ${usersNoPrefs.length}`);
  console.log("========================================\n");

  await conn.end();
}

main().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
