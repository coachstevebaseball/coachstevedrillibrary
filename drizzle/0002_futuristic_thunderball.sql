CREATE TABLE `assignmentProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`repsCompleted` int NOT NULL DEFAULT 0,
	`notes` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignmentProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drillAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(255) NOT NULL,
	`drillName` varchar(255) NOT NULL,
	`status` enum('assigned','in-progress','completed') NOT NULL DEFAULT 'assigned',
	`notes` text,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drillAssignments_id` PRIMARY KEY(`id`)
);
