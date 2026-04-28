CREATE TABLE `hittingCoachUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`usageDate` varchar(10) NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hittingCoachUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invites` MODIFY COLUMN `role` enum('admin','athlete') NOT NULL DEFAULT 'athlete';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','athlete') NOT NULL DEFAULT 'athlete';