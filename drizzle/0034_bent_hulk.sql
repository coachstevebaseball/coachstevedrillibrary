CREATE TABLE `athleteProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`birthDate` timestamp,
	`position` varchar(50),
	`secondaryPosition` varchar(50),
	`bats` enum('L','R','S'),
	`throws` enum('L','R'),
	`teamName` varchar(255),
	`focusAreas` json,
	`parentName` varchar(255),
	`parentEmail` varchar(320),
	`parentPhone` varchar(30),
	`coachProfileNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `athleteProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `athleteProfiles_userId_unique` UNIQUE(`userId`)
);
