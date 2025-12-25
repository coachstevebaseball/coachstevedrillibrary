CREATE TABLE `invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`inviteToken` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`acceptedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdByUserId` int NOT NULL,
	CONSTRAINT `invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `invites_inviteToken_unique` UNIQUE(`inviteToken`)
);
