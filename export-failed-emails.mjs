import m from 'mysql2/promise';
import fs from 'fs';

const conn = await m.createConnection(process.env.DATABASE_URL);

// Get all failed email deliveries (success = 0)
const [failed] = await conn.query('SELECT * FROM emailNotificationLog WHERE success = 0 ORDER BY createdAt DESC');
console.log(`Failed email deliveries: ${failed.length}`);

// Also get pendingEmailAlerts failures
const [pendingCols] = await conn.query('SHOW COLUMNS FROM pendingEmailAlerts');
console.log('pendingEmailAlerts columns:', pendingCols.map(c => c.Field).join(', '));

const [pendingFailed] = await conn.query('SELECT * FROM pendingEmailAlerts WHERE isSent = 0 ORDER BY createdAt DESC');
console.log(`Unsent pendingEmailAlerts: ${pendingFailed.length}`);

// Export failed emails to CSV
if (failed.length > 0) {
  const headers = ['id', 'recipientId', 'recipientEmail', 'recipientName', 'emailType', 'subject', 'description', 'metadata', 'success', 'errorMessage', 'resendId', 'createdAt'];
  const csvRows = failed.map(r => {
    return headers.map(h => {
      let val = r[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') val = JSON.stringify(val);
      if (val instanceof Date) val = val.toISOString();
      // Escape CSV
      val = String(val);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',');
  });
  const csv = [headers.join(','), ...csvRows].join('\n');
  fs.writeFileSync('/home/ubuntu/failed-email-deliveries.csv', csv);
  console.log(`Exported ${failed.length} failed emails to /home/ubuntu/failed-email-deliveries.csv`);
}

// Summary by error type
const errorGroups = {};
for (const r of failed) {
  const err = r.errorMessage || 'unknown';
  errorGroups[err] = (errorGroups[err] || 0) + 1;
}
console.log('\nFailed by error type:');
for (const [err, cnt] of Object.entries(errorGroups)) {
  console.log(`  ${err}: ${cnt}`);
}

// Summary by email type
const typeGroups = {};
for (const r of failed) {
  typeGroups[r.emailType] = (typeGroups[r.emailType] || 0) + 1;
}
console.log('\nFailed by email type:');
for (const [t, cnt] of Object.entries(typeGroups)) {
  console.log(`  ${t}: ${cnt}`);
}

// Total counts
const [allCounts] = await conn.query('SELECT success, COUNT(*) as cnt FROM emailNotificationLog GROUP BY success');
console.log('\nemailNotificationLog totals:', JSON.stringify(allCounts));

await conn.end();
