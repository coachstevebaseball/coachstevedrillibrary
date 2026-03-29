CREATE TABLE `drillStatCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drillId` varchar(128) NOT NULL,
	`label` varchar(128) NOT NULL,
	`value` varchar(512) NOT NULL DEFAULT '',
	`icon` varchar(64) DEFAULT 'info',
	`position` int NOT NULL DEFAULT 0,
	`isVisible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillStatCards_id` PRIMARY KEY(`id`)
);
