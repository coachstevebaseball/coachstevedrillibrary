CREATE TABLE `drillStatCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`icon` varchar(50) NOT NULL DEFAULT 'info',
	`position` int NOT NULL DEFAULT 0,
	`isVisible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillStatCards_id` PRIMARY KEY(`id`)
);
