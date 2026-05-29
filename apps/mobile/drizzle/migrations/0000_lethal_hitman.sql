CREATE TABLE `exercise_muscle_groups` (
	`exercise_id` text NOT NULL,
	`muscle_group` text NOT NULL,
	`weight` real NOT NULL,
	PRIMARY KEY(`exercise_id`, `muscle_group`),
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`equipment` text NOT NULL,
	`is_bodyweight` integer DEFAULT false NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`target_sets` integer NOT NULL,
	`target_reps_min` integer NOT NULL,
	`target_reps_max` integer NOT NULL,
	`target_weight` real,
	`notes` text,
	PRIMARY KEY(`routine_id`, `exercise_id`),
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`routine_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scheduled_sessions_date_unique` ON `scheduled_sessions` (`date`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`goal` text DEFAULT 'general' NOT NULL,
	`unit` text DEFAULT 'kg' NOT NULL,
	`body_weight` real,
	`birth_date` integer,
	`sex` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	`rpe` real,
	`rest_seconds` integer,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`notes` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null
);
