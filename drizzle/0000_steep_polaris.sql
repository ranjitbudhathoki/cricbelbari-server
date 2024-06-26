CREATE TABLE `batting_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`matches` integer NOT NULL,
	`innings` integer NOT NULL,
	`runs` integer NOT NULL,
	`balls_faced` integer NOT NULL,
	`high_score` integer NOT NULL,
	`outs` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bowling_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`matches` integer NOT NULL,
	`innings` integer NOT NULL,
	`wickets` integer NOT NULL,
	`overs` integer NOT NULL,
	`runs_conceded` integer NOT NULL,
	`best_bowing` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`batting_style` text NOT NULL,
	`bowling_style` text NOT NULL,
	`profile` text NOT NULL,
	`dob` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `batting_stats_player_id_unique` ON `batting_stats` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bowling_stats_player_id_unique` ON `bowling_stats` (`player_id`);