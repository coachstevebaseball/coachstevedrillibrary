CREATE TABLE `coachNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`coachId` int NOT NULL,
	`note` text NOT NULL,
	`meetingDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coachNotes_id` PRIMARY KEY(`id`)
);
