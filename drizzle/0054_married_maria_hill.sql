DROP TABLE `coachActivityLog`;--> statement-breakpoint
DROP TABLE `emailNotificationLog`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `peakHandSpeedMph`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `rotationalAccelerationG`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `connectionAtImpactDeg`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `earlyConnectionDeg`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `powerKpi`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `timeToContactSec`;--> statement-breakpoint
ALTER TABLE `drillAssignments` DROP COLUMN `dueDate`;--> statement-breakpoint
ALTER TABLE `drillAssignments` DROP COLUMN `reminderSent`;--> statement-breakpoint
ALTER TABLE `drillDetails` DROP COLUMN `drillType`;--> statement-breakpoint
ALTER TABLE `drillDetails` DROP COLUMN `ageLevel`;--> statement-breakpoint
ALTER TABLE `drillDetails` DROP COLUMN `focusTags`;--> statement-breakpoint
ALTER TABLE `drillDetails` DROP COLUMN `problemsFix`;--> statement-breakpoint
ALTER TABLE `drillDetails` DROP COLUMN `pillars`;