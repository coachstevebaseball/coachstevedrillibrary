CREATE TABLE `drillPageLayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`blocks` json NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillPageLayouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `drillPageLayouts_drillId_unique` UNIQUE(`drillId`)
);
