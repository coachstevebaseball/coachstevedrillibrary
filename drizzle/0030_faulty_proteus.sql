ALTER TABLE `practicePlanBlocks` ADD `coachingCues` text;--> statement-breakpoint
ALTER TABLE `practicePlanBlocks` ADD `keyPoints` text;--> statement-breakpoint
ALTER TABLE `practicePlanBlocks` ADD `equipment` varchar(500);--> statement-breakpoint
ALTER TABLE `practicePlanBlocks` ADD `intensity` enum('low','medium','high');--> statement-breakpoint
ALTER TABLE `practicePlanBlocks` ADD `goal` varchar(500);