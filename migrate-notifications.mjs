import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log("=== Upgrading notifications table ===");
  
  // 1. Add new columns to notifications table (if they don't exist)
  const notifNewCols = [
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipientEmail VARCHAR(320) AFTER userId`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS linkUrl VARCHAR(500) AFTER relatedType`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS emailStatus ENUM('pending','queued','sent','failed','delivered','opened','clicked') NOT NULL DEFAULT 'pending' AFTER linkUrl`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS portalStatus ENUM('unread','read') NOT NULL DEFAULT 'unread' AFTER emailStatus`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS queuedAt TIMESTAMP NULL AFTER createdAt`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sentAt TIMESTAMP NULL AFTER queuedAt`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS failedAt TIMESTAMP NULL AFTER readAt`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retryCount INT NOT NULL DEFAULT 0 AFTER failedAt`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS lastError TEXT AFTER retryCount`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedupeKey VARCHAR(255) AFTER lastError`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSON AFTER dedupeKey`,
  ];

  for (const sql of notifNewCols) {
    try {
      await conn.execute(sql);
      console.log("  ✓", sql.substring(0, 80) + "...");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME" || e.message.includes("Duplicate column")) {
        console.log("  ⏭ Column already exists, skipping");
      } else {
        console.error("  ✗ Error:", e.message);
      }
    }
  }

  // 2. Modify relatedId from INT to VARCHAR(255) if it's currently INT
  try {
    await conn.execute(`ALTER TABLE notifications MODIFY COLUMN relatedId VARCHAR(255)`);
    console.log("  ✓ Modified relatedId to VARCHAR(255)");
  } catch (e) {
    console.log("  ⏭ relatedId modification:", e.message);
  }

  // 3. Update the type enum to include new notification types
  try {
    await conn.execute(`ALTER TABLE notifications MODIFY COLUMN type ENUM('drill_assigned','notes_added','recap_posted','swing_analysis_ready','new_feature_available','feedback_received','submission_received','badge_earned','practice_plan_shared','welcome','system','submission','feedback','badge','assignment') NOT NULL`);
    console.log("  ✓ Updated type enum with new notification types (keeping old values for backward compat)");
  } catch (e) {
    console.error("  ✗ Type enum update:", e.message);
  }

  // 4. Remove old columns from notifications if they exist (isRead, actionUrl replaced by portalStatus, linkUrl)
  const oldNotifCols = ["isRead", "actionUrl"];
  for (const col of oldNotifCols) {
    try {
      await conn.execute(`ALTER TABLE notifications DROP COLUMN ${col}`);
      console.log(`  ✓ Dropped old column: ${col}`);
    } catch (e) {
      if (e.message.includes("check that it exists")) {
        console.log(`  ⏭ Column ${col} already removed`);
      } else {
        console.log(`  ⏭ ${col}: ${e.message}`);
      }
    }
  }

  console.log("\n=== Upgrading notificationPreferences table ===");

  // 5. Add new columns to notificationPreferences
  const prefNewCols = [
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS drillAssignments INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS notesUpdates INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS recapUpdates INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS swingAnalysis INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS featureAnnouncements INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS feedbackUpdates INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS submissionUpdates INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS badgeUpdates INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS practicePlanUpdates INT NOT NULL DEFAULT 1`,
    `ALTER TABLE notificationPreferences ADD COLUMN IF NOT EXISTS systemUpdates INT NOT NULL DEFAULT 1`,
  ];

  for (const sql of prefNewCols) {
    try {
      await conn.execute(sql);
      console.log("  ✓", sql.substring(0, 80) + "...");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME" || e.message.includes("Duplicate column")) {
        console.log("  ⏭ Column already exists, skipping");
      } else {
        console.error("  ✗ Error:", e.message);
      }
    }
  }

  // 6. Drop old columns from notificationPreferences
  const oldPrefCols = [
    "submissionNotifications",
    "feedbackNotifications",
    "badgeNotifications",
    "assignmentNotifications",
    "systemNotifications",
    "inAppNotifications",
  ];

  for (const col of oldPrefCols) {
    try {
      await conn.execute(`ALTER TABLE notificationPreferences DROP COLUMN ${col}`);
      console.log(`  ✓ Dropped old column: ${col}`);
    } catch (e) {
      if (e.message.includes("check that it exists")) {
        console.log(`  ⏭ Column ${col} already removed`);
      } else {
        console.log(`  ⏭ ${col}: ${e.message}`);
      }
    }
  }

  console.log("\n=== Migration complete ===");
  await conn.end();
}

run().catch(console.error);
