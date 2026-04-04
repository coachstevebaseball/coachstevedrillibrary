CREATE TABLE `blastMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`planeScore` int,
	`connectionScore` int,
	`rotationScore` int,
	`batSpeedMph` varchar(10),
	`rotationalAccelerationG` varchar(10),
	`onPlaneEfficiencyPercent` varchar(10),
	`attackAngleDeg` varchar(10),
	`earlyConnectionDeg` varchar(10),
	`connectionAtImpactDeg` varchar(10),
	`verticalBatAngleDeg` varchar(10),
	`powerKw` varchar(10),
	`timeToContactSec` varchar(10),
	`peakHandSpeedMph` varchar(10),
	CONSTRAINT `blastMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blastPlayers` (
	`id` varchar(36) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blastPlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blastSessions` (
	`id` varchar(36) NOT NULL,
	`playerId` varchar(36) NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`sessionType` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blastSessions_id` PRIMARY KEY(`id`)
);
