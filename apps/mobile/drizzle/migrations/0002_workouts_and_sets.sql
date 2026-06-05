ALTER TABLE `sets` ADD `position` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sets` ADD `done` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sets` ADD `completed_at` integer;--> statement-breakpoint
CREATE INDEX `sets_workout_idx` ON `sets` (`workout_id`);--> statement-breakpoint
CREATE INDEX `sets_exercise_idx` ON `sets` (`exercise_id`);--> statement-breakpoint
CREATE INDEX `workouts_started_at_idx` ON `workouts` (`started_at`);