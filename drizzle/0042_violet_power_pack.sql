ALTER TABLE `blastMetrics` ADD `exitVelocityMph` varchar(10);--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `planeScore`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `connectionScore`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `rotationScore`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `rotationalAccelerationG`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `earlyConnectionDeg`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `connectionAtImpactDeg`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `verticalBatAngleDeg`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `powerKw`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `timeToContactSec`;--> statement-breakpoint
ALTER TABLE `blastMetrics` DROP COLUMN `peakHandSpeedMph`;