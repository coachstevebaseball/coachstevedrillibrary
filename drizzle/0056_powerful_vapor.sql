CREATE TABLE `playerReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`coachId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`bodyHtml` longtext,
	`isSharedWithAthlete` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blastSessions` ADD `isSharedWithAthlete` boolean DEFAULT true NOT NULL;