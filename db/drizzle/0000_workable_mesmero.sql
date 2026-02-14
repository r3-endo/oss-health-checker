CREATE TABLE `repositories` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repositories_url_unique` ON `repositories` (`url`);--> statement-breakpoint
CREATE TABLE `snapshot_warning_reasons` (
	`snapshot_id` text NOT NULL,
	`reason_key` text NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "snapshot_warning_reasons_reason_check" CHECK("snapshot_warning_reasons"."reason_key" IN ('commit_stale', 'release_stale', 'open_issues_high'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `snapshot_warning_reasons_pk` ON `snapshot_warning_reasons` (`snapshot_id`,`reason_key`);--> statement-breakpoint
CREATE INDEX `snapshot_warning_reasons_reason_idx` ON `snapshot_warning_reasons` (`reason_key`);--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`repository_id` text NOT NULL,
	`last_commit_at` integer NOT NULL,
	`last_release_at` integer,
	`open_issues_count` integer NOT NULL,
	`contributors_count` integer NOT NULL,
	`status` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "snapshots_status_check" CHECK("snapshots"."status" IN ('Active', 'Stale', 'Risky'))
);
--> statement-breakpoint
CREATE INDEX `snapshots_repository_fetched_idx` ON `snapshots` (`repository_id`,`fetched_at`);