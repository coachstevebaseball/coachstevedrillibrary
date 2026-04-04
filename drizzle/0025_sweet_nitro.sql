CREATE TABLE `quizAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`totalQuestions` int NOT NULL,
	`percentage` int NOT NULL,
	`quizType` enum('standard','adaptive') NOT NULL DEFAULT 'standard',
	`targetCategory` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestionResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedAnswerIndex` int NOT NULL,
	`isCorrect` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizQuestionResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenario` text NOT NULL,
	`answers` json NOT NULL,
	`correctIndex` int NOT NULL,
	`explanation` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`isAiGenerated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`)
);
