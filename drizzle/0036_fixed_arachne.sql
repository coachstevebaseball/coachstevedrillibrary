ALTER TABLE `videoAnalysis` MODIFY COLUMN `submissionId` int;--> statement-breakpoint
ALTER TABLE `videoAnalysis` MODIFY COLUMN `drillId` varchar(255);--> statement-breakpoint
ALTER TABLE `videoAnalysis` ADD `swingType` varchar(100);--> statement-breakpoint
ALTER TABLE `videoAnalysis` ADD `athleteNotes` text;--> statement-breakpoint
ALTER TABLE `videoAnalysis` ADD `isStandalone` int DEFAULT 0 NOT NULL;