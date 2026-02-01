CREATE TABLE `drillCustomizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`thumbnailUrl` text,
	`briefDescription` text,
	`difficulty` varchar(50),
	`category` varchar(100),
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillCustomizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `drillCustomizations_drillId_unique` UNIQUE(`drillId`)
);
