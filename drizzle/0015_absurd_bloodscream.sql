CREATE TABLE `customDrills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`difficulty` varchar(50) NOT NULL,
	`category` varchar(100) NOT NULL,
	`duration` varchar(50) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customDrills_id` PRIMARY KEY(`id`),
	CONSTRAINT `customDrills_drillId_unique` UNIQUE(`drillId`)
);
