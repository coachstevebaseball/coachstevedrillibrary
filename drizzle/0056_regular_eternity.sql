ALTER TABLE `notifications` MODIFY COLUMN `type` enum('drill_assigned','notes_added','recap_posted','swing_analysis_ready','new_feature_available','feedback_received','submission_received','badge_earned','practice_plan_shared','welcome','system') NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `relatedId` varchar(255);--> statement-breakpoint
ALTER TABLE `customDrills` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `drillAssignments` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `notesUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `recapUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `swingAnalysis` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `featureAnnouncements` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `feedbackUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `submissionUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `badgeUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `practicePlanUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD `systemUpdates` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `recipientEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `notifications` ADD `linkUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `notifications` ADD `emailStatus` enum('pending','queued','sent','failed','delivered','opened','clicked') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `portalStatus` enum('unread','read') DEFAULT 'unread' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `queuedAt` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `sentAt` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `failedAt` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `retryCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `lastError` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `dedupeKey` varchar(255);--> statement-breakpoint
ALTER TABLE `notifications` ADD `metadata` json;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP COLUMN `submissionNotifications`;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP COLUMN `feedbackNotifications`;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP COLUMN `badgeNotifications`;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP COLUMN `assignmentNotifications`;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP COLUMN `systemNotifications`;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP COLUMN `inAppNotifications`;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `isRead`;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `actionUrl`;