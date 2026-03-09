CREATE TABLE `archivedDrills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalDrillId` varchar(500) NOT NULL,
	`name` varchar(500) NOT NULL,
	`difficulty` varchar(50) NOT NULL,
	`categories` json NOT NULL,
	`duration` varchar(100) NOT NULL,
	`url` text,
	`isDirectLink` boolean DEFAULT false,
	`fullData` json NOT NULL,
	`archiveReason` varchar(255) DEFAULT 'non-hitting-category-removal',
	`archivedAt` timestamp NOT NULL DEFAULT (now()),
	`archivedBy` int,
	CONSTRAINT `archivedDrills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentKey` varchar(500) NOT NULL,
	`value` text NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteContent_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteContent_contentKey_unique` UNIQUE(`contentKey`)
);
--> statement-breakpoint
ALTER TABLE `invites` ADD `name` varchar(255);