CREATE TABLE `adoption_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`repository_id` text NOT NULL,
	`source` text NOT NULL,
	`package_name` text NOT NULL,
	`weekly_downloads` integer,
	`downloads_delta_7d` integer,
	`downloads_delta_30d` integer,
	`last_published_at` text,
	`latest_version` text,
	`fetch_status` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "adoption_snapshots_source_check" CHECK("adoption_snapshots"."source" IN ('npm', 'maven-central', 'pypi', 'homebrew', 'docker')),
	CONSTRAINT "adoption_snapshots_fetch_status_check" CHECK("adoption_snapshots"."fetch_status" IN ('succeeded', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `adoption_snapshots_repository_fetched_idx` ON `adoption_snapshots` (`repository_id`,`fetched_at`);--> statement-breakpoint
CREATE INDEX `adoption_snapshots_source_idx` ON `adoption_snapshots` (`source`);--> statement-breakpoint
CREATE TABLE `repository_package_mappings` (
	`repository_id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`package_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "repository_package_mappings_source_check" CHECK("repository_package_mappings"."source" IN ('npm', 'maven-central', 'pypi', 'homebrew', 'docker'))
);
--> statement-breakpoint
CREATE INDEX `repository_package_mappings_source_idx` ON `repository_package_mappings` (`source`);