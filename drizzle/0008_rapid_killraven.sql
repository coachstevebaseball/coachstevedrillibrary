CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeType` varchar(100) NOT NULL,
	`badgeName` varchar(255) NOT NULL,
	`badgeDescription` text,
	`badgeIcon` varchar(50),
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
