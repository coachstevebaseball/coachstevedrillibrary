CREATE TABLE `weeklyGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`coachId` int NOT NULL,
	`weekStartDate` timestamp NOT NULL,
	`weekEndDate` timestamp NOT NULL,
	`targetDrillCount` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyGoals_id` PRIMARY KEY(`id`)
);
