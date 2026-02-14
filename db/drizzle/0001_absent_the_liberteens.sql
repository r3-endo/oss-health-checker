CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_system` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `repository_categories` (
	`repository_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repository_categories_pk` ON `repository_categories` (`repository_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `repository_categories_repository_idx` ON `repository_categories` (`repository_id`);--> statement-breakpoint
CREATE INDEX `repository_categories_category_idx` ON `repository_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `repository_snapshots` (
	`repository_id` text NOT NULL,
	`recorded_at` text NOT NULL,
	`open_issues` integer NOT NULL,
	`commit_count_30d` integer,
	`commit_count_total` integer,
	`contributor_count` integer,
	`last_commit_at` text,
	`last_release_at` text,
	`release_count` integer,
	`star_count` integer,
	`fork_count` integer,
	`distinct_committers_90d` integer,
	`top_contributor_ratio_90d` integer,
	`health_score_version` integer,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repository_snapshots_pk` ON `repository_snapshots` (`repository_id`,`recorded_at`);--> statement-breakpoint
CREATE INDEX `repository_snapshots_recorded_idx` ON `repository_snapshots` (`recorded_at`);