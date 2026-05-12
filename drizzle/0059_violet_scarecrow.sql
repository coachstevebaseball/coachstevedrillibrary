ALTER TABLE `drills` ADD `equipment` json;--> statement-breakpoint
ALTER TABLE `drills` ADD `repsSets` varchar(100);--> statement-breakpoint
ALTER TABLE `drills` ADD `nextStepDrillIds` json;--> statement-breakpoint
ALTER TABLE `drills` ADD `featured` boolean DEFAULT false NOT NULL;