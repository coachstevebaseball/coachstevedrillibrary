CREATE TABLE `drillVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`videoUrl` text NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillVideos_id` PRIMARY KEY(`id`),
	CONSTRAINT `drillVideos_drillId_unique` UNIQUE(`drillId`)
);
