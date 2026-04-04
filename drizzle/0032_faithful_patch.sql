ALTER TABLE `drillPageTemplates` MODIFY COLUMN `isSystem` int NOT NULL;--> statement-breakpoint
ALTER TABLE `drillPageTemplates` MODIFY COLUMN `isSystem` int NOT NULL DEFAULT 0;