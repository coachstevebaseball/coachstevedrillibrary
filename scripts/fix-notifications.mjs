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
  console.log("  NOTIFICATION FIX SCRIPT");
  console.log("========================================\n");

  // ─── FIX 1: Delete orphaned notifications ───────────────────────────────
  console.log("── FIX 1: Delete orphaned notifications ──────────────────");
  const [orphanedCount] = await conn.query(`
    SELECT COUNT(*) as cnt
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    WHERE u.id IS NULL
  `);
  console.log(`Found ${orphanedCount[0].cnt} orphaned notifications`);

  if (orphanedCount[0].cnt > 0) {
    const [deleteResult] = await conn.query(`
      DELETE n FROM notifications n
      LEFT JOIN users u ON n.userId = u.id
      WHERE u.id IS NULL
    `);
    console.log(`✅ Deleted ${deleteResult.affectedRows} orphaned notifications\n`);
  }

  // ─── FIX 2: Backfill recipientEmail from users table ────────────────────
  console.log("── FIX 2: Backfill recipientEmail from users table ──────");
  const [nullEmailCount] = await conn.query(`
    SELECT COUNT(*) as cnt
    FROM notifications n
    JOIN users u ON n.userId = u.id
    WHERE (n.recipientEmail IS NULL OR n.recipientEmail = '')
      AND u.email IS NOT NULL AND u.email != ''
  `);
  console.log(`Found ${nullEmailCount[0].cnt} notifications with null recipientEmail (user has email)`);

  if (nullEmailCount[0].cnt > 0) {
    const [updateResult] = await conn.query(`
      UPDATE notifications n
      JOIN users u ON n.userId = u.id
      SET n.recipientEmail = u.email
      WHERE (n.recipientEmail IS NULL OR n.recipientEmail = '')
        AND u.email IS NOT NULL AND u.email != ''
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} notifications with user email\n`);
  }

  // ─── FIX 3: Fix invalid notification type "assignment" → "drill_assigned" ─
  console.log("── FIX 3: Fix invalid type 'assignment' → 'drill_assigned' ──");
  const [invalidTypeCount] = await conn.query(`
    SELECT COUNT(*) as cnt FROM notifications WHERE type = 'assignment'
  `);
  console.log(`Found ${invalidTypeCount[0].cnt} notifications with type 'assignment'`);

  if (invalidTypeCount[0].cnt > 0) {
    const [fixResult] = await conn.query(`
      UPDATE notifications SET type = 'drill_assigned' WHERE type = 'assignment'
    `);
    console.log(`✅ Fixed ${fixResult.affectedRows} notifications to type 'drill_assigned'\n`);
  }

  // ─── FIX 4: Process pending notifications that now have recipientEmail ──
  // Mark portal-only system notifications (coach activity alerts) as "sent" 
  // since they were never meant to be emailed
  console.log("── FIX 4: Mark coach activity alerts as sent (portal-only) ──");
  const [coachPending] = await conn.query(`
    SELECT COUNT(*) as cnt
    FROM notifications
    WHERE emailStatus = 'pending'
      AND type = 'system'
      AND (relatedType = 'athlete_activity' OR relatedType = 'inactivity_flag')
  `);
  console.log(`Found ${coachPending[0].cnt} coach activity alerts stuck in pending`);

  if (coachPending[0].cnt > 0) {
    const [markResult] = await conn.query(`
      UPDATE notifications
      SET emailStatus = 'sent', sentAt = NOW()
      WHERE emailStatus = 'pending'
        AND type = 'system'
        AND (relatedType = 'athlete_activity' OR relatedType = 'inactivity_flag')
    `);
    console.log(`✅ Marked ${markResult.affectedRows} coach alerts as sent (portal-only)\n`);
  }

  // ─── FIX 5: Mark remaining pending system notifications for coach as sent ──
  console.log("── FIX 5: Mark remaining coach system notifications as sent ──");
  const [coachSystemPending] = await conn.query(`
    SELECT COUNT(*) as cnt
    FROM notifications n
    JOIN users u ON n.userId = u.id
    WHERE n.emailStatus = 'pending'
      AND n.type = 'system'
      AND u.role = 'admin'
  `);
  console.log(`Found ${coachSystemPending[0].cnt} coach system notifications in pending`);

  if (coachSystemPending[0].cnt > 0) {
    const [markResult2] = await conn.query(`
      UPDATE notifications n
      JOIN users u ON n.userId = u.id
      SET n.emailStatus = 'sent', n.sentAt = NOW()
      WHERE n.emailStatus = 'pending'
        AND n.type = 'system'
        AND u.role = 'admin'
    `);
    console.log(`✅ Marked ${markResult2.affectedRows} coach system notifications as sent\n`);
  }

  // ─── VERIFICATION ──────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log("  POST-FIX VERIFICATION");
  console.log("========================================\n");

  // Remaining orphans
  const [remainingOrphans] = await conn.query(`
    SELECT COUNT(*) as cnt
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    WHERE u.id IS NULL
  `);
  console.log(`Remaining orphaned notifications: ${remainingOrphans[0].cnt}`);

  // Remaining null recipientEmail
  const [remainingNullEmail] = await conn.query(`
    SELECT COUNT(*) as cnt
    FROM notifications
    WHERE recipientEmail IS NULL OR recipientEmail = ''
  `);
  console.log(`Remaining notifications with null recipientEmail: ${remainingNullEmail[0].cnt}`);

  // Remaining invalid types
  const [remainingInvalid] = await conn.query(`
    SELECT COUNT(*) as cnt FROM notifications WHERE type = 'assignment'
  `);
  console.log(`Remaining notifications with type 'assignment': ${remainingInvalid[0].cnt}`);

  // Remaining pending
  const [remainingPending] = await conn.query(`
    SELECT COUNT(*) as cnt FROM notifications WHERE emailStatus = 'pending'
  `);
  console.log(`Remaining pending notifications: ${remainingPending[0].cnt}`);

  // Notification counts per user
  const [perUser] = await conn.query(`
    SELECT n.userId, u.name, u.email, u.role,
      COUNT(*) as total,
      SUM(CASE WHEN n.emailStatus='sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN n.emailStatus='pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN n.recipientEmail IS NOT NULL AND n.recipientEmail != '' THEN 1 ELSE 0 END) as hasEmail
    FROM notifications n
    JOIN users u ON n.userId = u.id
    GROUP BY n.userId, u.name, u.email, u.role
    ORDER BY total DESC
  `);
  console.log("\nNotifications per user (post-fix):");
  console.table(perUser.map(r => ({
    UserID: r.userId,
    Name: r.name || '(none)',
    Email: r.email || '(none)',
    Role: r.role,
    Total: r.total,
    Sent: r.sent,
    Pending: r.pending,
    HasEmail: r.hasEmail,
  })));

  // Type breakdown
  const [types] = await conn.query(`
    SELECT type, COUNT(*) as cnt FROM notifications GROUP BY type ORDER BY cnt DESC
  `);
  console.log("Notification type breakdown (post-fix):");
  console.table(types);

  // Total summary
  const [total] = await conn.query(`SELECT COUNT(*) as cnt FROM notifications`);
  console.log(`\nTotal notifications remaining: ${total[0].cnt}`);

  console.log("\n========================================");
  console.log("  FIX COMPLETE");
  console.log("========================================\n");

  await conn.end();
}

main().catch(err => {
  console.error("Fix script failed:", err);
  process.exit(1);
});
