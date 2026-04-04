CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionNotifications` int NOT NULL DEFAULT 1,
	`feedbackNotifications` int NOT NULL DEFAULT 1,
	`badgeNotifications` int NOT NULL DEFAULT 1,
	`assignmentNotifications` int NOT NULL DEFAULT 1,
	`systemNotifications` int NOT NULL DEFAULT 1,
	`emailNotifications` int NOT NULL DEFAULT 1,
	`inAppNotifications` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('submission','feedback','badge','assignment','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedId` int,
	`relatedType` varchar(50),
	`isRead` int NOT NULL DEFAULT 0,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
