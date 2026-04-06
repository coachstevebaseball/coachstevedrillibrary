ALTER TABLE `blastMetrics` ADD `peakHandSpeedMph` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `rotationalAccelerationG` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `connectionAtImpactDeg` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `earlyConnectionDeg` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `powerKpi` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` ADD `timeToContactSec` varchar(10);--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `drillType` varchar(100);--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `ageLevel` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `focusTags` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `problemsFix` json;--> statement-breakpoint
ALTER TABLE `drillDetails` ADD `pillars` json;