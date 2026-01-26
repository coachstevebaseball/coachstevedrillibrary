CREATE TABLE `pendingEmailAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`athleteId` int NOT NULL,
	`athleteName` varchar(255),
	`activityType` varchar(50) NOT NULL,
	`activityMessage` text NOT NULL,
	`actionUrl` varchar(500),
	`metadata` json,
	`batchKey` varchar(100) NOT NULL,
	`scheduledSendAt` timestamp NOT NULL,
	`isSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pendingEmailAlerts_id` PRIMARY KEY(`id`)
);
