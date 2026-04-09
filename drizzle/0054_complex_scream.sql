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
ALTER TABLE `blastMetrics` ADD `peakHandSpeedMph` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `rotationalAccelerationG` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `connectionAtImpactDeg` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `earlyConnectionDeg` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `powerKpi` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `timeToContactSec` varchar(10);--> statement-breakpoint
ALTER TABLE `drillAssignments` ADD `dueDate` timestamp;--> statement-breakpoint
ALTER TABLE `drillAssignments` ADD `reminderSent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `drillType` varchar(100);--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `ageLevel` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `focusTags` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `problemsFix` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `pillars` json;