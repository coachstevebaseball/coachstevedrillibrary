CREATE TABLE `practicePlanBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`sortOrder` int NOT NULL,
	`blockType` enum('drill','warmup','cooldown','break','custom') NOT NULL,
	`drillId` varchar(255),
	`title` varchar(255) NOT NULL,
	`duration` int NOT NULL,
	`sets` int,
	`reps` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practicePlanBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practicePlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`athleteId` int,
	`inviteId` int,
	`title` varchar(255) NOT NULL,
	`sessionDate` timestamp,
	`duration` int NOT NULL,
	`sessionNotes` text,
	`focusAreas` json,
	`status` enum('draft','scheduled','completed','cancelled') NOT NULL DEFAULT 'draft',
	`isShared` int NOT NULL DEFAULT 0,
	`isTemplate` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practicePlans_id` PRIMARY KEY(`id`)
);
