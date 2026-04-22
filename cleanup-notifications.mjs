import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
const m = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const conn = await createConnection({
  host: m[3], port: +m[4], user: m[1], password: m[2], database: m[5],
  ssl: { rejectUnauthorized: false }
});

console.log('=== NOTIFICATION CLEANUP ===\n');

// 1. Mark all unread notifications older than 30 days as read (archive)
const [archiveResult] = await conn.execute(
  "UPDATE notifications SET readAt = NOW() WHERE readAt IS NULL AND createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)"
);
console.log(`1. Archived ${archiveResult.affectedRows} stale unread notifications (>30 days old)`);

// 2. Delete notifications older than 90 days (they've been archived/read already)
const [deleteOld] = await conn.execute(
  "DELETE FROM notifications WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)"
);
console.log(`2. Deleted ${deleteOld.affectedRows} notifications older than 90 days`);

// 3. Clean up sent pendingEmailAlerts older than 30 days
const [deleteSentAlerts] = await conn.execute(
  "DELETE FROM pendingEmailAlerts WHERE isSent = 1 AND createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)"
);
console.log(`3. Deleted ${deleteSentAlerts.affectedRows} sent pendingEmailAlerts (>30 days old)`);

// 4. Clean up stale unsent pendingEmailAlerts older than 7 days (they'll never send)
const [deleteStaleAlerts] = await conn.execute(
  "DELETE FROM pendingEmailAlerts WHERE isSent = 0 AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY)"
);
console.log(`4. Deleted ${deleteStaleAlerts.affectedRows} stale unsent pendingEmailAlerts (>7 days old)`);

// 5. Clean up emailNotificationLog older than 90 days
const [deleteOldLogs] = await conn.execute(
  "DELETE FROM emailNotificationLog WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)"
);
console.log(`5. Deleted ${deleteOldLogs.affectedRows} email log entries older than 90 days`);

// 6. Seed notification preferences for users who don't have them
const [usersWithoutPrefs] = await conn.execute(`
  SELECT u.id FROM users u
  LEFT JOIN notificationPreferences np ON u.id = np.userId
  WHERE np.id IS NULL
`);
let seeded = 0;
for (const u of usersWithoutPrefs) {
  await conn.execute(
    "INSERT INTO notificationPreferences (userId) VALUES (?)",
    [u.id]
  );
  seeded++;
}
console.log(`6. Seeded notification preferences for ${seeded} users`);

// Final stats
console.log('\n=== POST-CLEANUP STATS ===');
const [notifTotal] = await conn.execute('SELECT COUNT(*) as cnt FROM notifications');
const [notifUnread] = await conn.execute('SELECT COUNT(*) as cnt FROM notifications WHERE readAt IS NULL');
const [pendingTotal] = await conn.execute('SELECT COUNT(*) as cnt FROM pendingEmailAlerts');
const [emailTotal] = await conn.execute('SELECT COUNT(*) as cnt FROM emailNotificationLog');
const [prefTotal] = await conn.execute('SELECT COUNT(*) as cnt FROM notificationPreferences');

console.log(`Notifications: ${notifTotal[0].cnt} total, ${notifUnread[0].cnt} unread`);
console.log(`Pending alerts: ${pendingTotal[0].cnt}`);
console.log(`Email log: ${emailTotal[0].cnt}`);
console.log(`Preferences: ${prefTotal[0].cnt} users configured`);

await conn.end();
console.log('\n✓ Notification cleanup complete');
