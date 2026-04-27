CREATE TABLE `emailEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailId` varchar(255) NOT NULL,
	`svixId` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`payloadJson` json NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailEvents_svixId_unique` UNIQUE(`svixId`)
);
--> statement-breakpoint
ALTER TABLE `emailNotificationLog` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailNotificationLog` ADD `openedAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailNotificationLog` ADD `clickedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailBounced` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailComplained` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailFailureCount` int DEFAULT 0 NOT NULL;