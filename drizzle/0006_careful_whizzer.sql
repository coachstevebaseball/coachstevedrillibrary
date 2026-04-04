CREATE TABLE `drillDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`skillSet` varchar(255) NOT NULL,
	`difficulty` varchar(50) NOT NULL,
	`athletes` varchar(255) NOT NULL,
	`time` varchar(50) NOT NULL,
	`equipment` varchar(255) NOT NULL,
	`goal` text NOT NULL,
	`description` json NOT NULL,
	`commonMistakes` json,
	`progressions` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillDetails_id` PRIMARY KEY(`id`),
	CONSTRAINT `drillDetails_drillId_unique` UNIQUE(`drillId`)
);
