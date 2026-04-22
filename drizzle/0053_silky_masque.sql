CREATE TABLE `coachActivityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`athleteId` int,
	`athleteName` varchar(255),
	`metadata` json,
	`severity` varchar(20) NOT NULL DEFAULT 'info',
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coachActivityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drillStatCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`icon` varchar(50) NOT NULL DEFAULT 'info',
	`position` int NOT NULL DEFAULT 0,
	`isVisible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillStatCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`difficulty` enum('Easy','Medium','Hard'),
	`categories` json NOT NULL,
	`duration` varchar(50),
	`url` text,
	`isDirectLink` boolean NOT NULL DEFAULT false,
	`ageLevel` json,
	`tags` json,
	`problem` json,
	`goal` json,
	`drillType` varchar(100),
	`problems` json,
	`outcomes` json,
	`source` varchar(20) NOT NULL DEFAULT 'static',
	`isHidden` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drills_id` PRIMARY KEY(`id`),
	CONSTRAINT `drills_drillId_unique` UNIQUE(`drillId`)
);
--> statement-breakpoint
CREATE TABLE `emailNotificationLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`emailType` varchar(100) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`description` text,
	`metadata` json,
	`success` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`resendId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailNotificationLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('drill_assigned','notes_added','recap_posted','swing_analysis_ready','new_feature_available','feedback_received','submission_received','badge_earned','practice_plan_shared','welcome','system') NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `relatedId` varchar(255);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `peakHandSpeedMph` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `rotationalAccelerationG` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `connectionAtImpactDeg` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `earlyConnectionDeg` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `powerKpi` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `timeToContactSec` varchar(10);--> statement-breakpoint
ALTER TABLE `customDrills` ADD `drillType` varchar(100);--> statement-breakpoint
ALTER TABLE `customDrills` ADD `ageLevel` text;--> statement-breakpoint
ALTER TABLE `customDrills` ADD `focusTags` text;--> statement-breakpoint
ALTER TABLE `customDrills` ADD `problemsFix` text;--> statement-breakpoint
ALTER TABLE `customDrills` ADD `pillars` text;--> statement-breakpoint
ALTER TABLE `customDrills` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `drillAssignments` ADD `dueDate` timestamp;--> statement-breakpoint
ALTER TABLE `drillAssignments` ADD `reminderSent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `drillType` varchar(100);--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `ageLevel` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `focusTags` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `problemsFix` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `pillars` json;--> statement-breakpoint
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