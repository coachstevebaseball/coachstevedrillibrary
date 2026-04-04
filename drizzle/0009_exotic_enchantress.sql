CREATE TABLE `coachFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`coachId` int NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`feedback` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coachFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drillSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`notes` text,
	`videoUrl` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillSubmissions_id` PRIMARY KEY(`id`)
);
