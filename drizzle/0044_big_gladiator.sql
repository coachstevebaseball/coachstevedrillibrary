CREATE TABLE `archivedDrills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalDrillId` int NOT NULL,
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
