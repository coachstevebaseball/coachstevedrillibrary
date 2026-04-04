CREATE TABLE `drillAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`coachId` int NOT NULL,
	`answer` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drillAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drillQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drillQuestions_id` PRIMARY KEY(`id`)
);
