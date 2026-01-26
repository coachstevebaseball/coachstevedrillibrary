CREATE TABLE `athleteActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`activityType` enum('portal_login','drill_view','assignment_view','drill_start','drill_complete','video_submit','message_sent','profile_update') NOT NULL,
	`relatedId` varchar(255),
	`relatedType` varchar(50),
	`metadata` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `athleteActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coachAlertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`alertOnPortalLogin` int NOT NULL DEFAULT 1,
	`alertOnDrillView` int NOT NULL DEFAULT 1,
	`alertOnAssignmentView` int NOT NULL DEFAULT 1,
	`alertOnDrillStart` int NOT NULL DEFAULT 1,
	`alertOnDrillComplete` int NOT NULL DEFAULT 1,
	`alertOnVideoSubmit` int NOT NULL DEFAULT 1,
	`alertOnMessageSent` int NOT NULL DEFAULT 1,
	`alertOnInactivity` int NOT NULL DEFAULT 1,
	`inactivityDays` int NOT NULL DEFAULT 3,
	`inAppAlerts` int NOT NULL DEFAULT 1,
	`emailDigest` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coachAlertPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `coachAlertPreferences_coachId_unique` UNIQUE(`coachId`)
);
