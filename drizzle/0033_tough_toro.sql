CREATE TABLE `progressReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`athleteId` int NOT NULL,
	`sessionNoteId` int,
	`title` varchar(500) NOT NULL,
	`reportContent` json NOT NULL,
	`reportHtml` longtext,
	`reportStatus` enum('draft','reviewed','sent') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`sentToEmail` varchar(320),
	`sentToName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progressReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`athleteId` int NOT NULL,
	`sessionNumber` int NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`duration` int,
	`skillsWorked` json NOT NULL,
	`whatImproved` text NOT NULL,
	`whatNeedsWork` text NOT NULL,
	`homeworkDrills` json,
	`overallRating` int,
	`privateNotes` text,
	`practicePlanId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessionNotes_id` PRIMARY KEY(`id`)
);
