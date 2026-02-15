import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const repositoriesTable = sqliteTable(
  "repositories",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("repositories_url_unique").on(table.url)],
);

export const snapshotsTable = sqliteTable(
  "snapshots",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    lastCommitAt: integer("last_commit_at", { mode: "timestamp_ms" }).notNull(),
    lastReleaseAt: integer("last_release_at", { mode: "timestamp_ms" }),
    openIssuesCount: integer("open_issues_count").notNull(),
    contributorsCount: integer("contributors_count").notNull(),
    status: text("status").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("snapshots_repository_fetched_idx").on(
      table.repositoryId,
      table.fetchedAt,
    ),
    check(
      "snapshots_status_check",
      sql`${table.status} IN ('Active', 'Stale', 'Risky')`,
    ),
  ],
);

export const snapshotWarningReasonsTable = sqliteTable(
  "snapshot_warning_reasons",
  {
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => snapshotsTable.id, { onDelete: "cascade" }),
    reasonKey: text("reason_key").notNull(),
  },
  (table) => [
    uniqueIndex("snapshot_warning_reasons_pk").on(
      table.snapshotId,
      table.reasonKey,
    ),
    index("snapshot_warning_reasons_reason_idx").on(table.reasonKey),
    check(
      "snapshot_warning_reasons_reason_check",
      sql`${table.reasonKey} IN ('commit_stale', 'release_stale', 'open_issues_high')`,
    ),
  ],
);

export const categoriesTable = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const repositoryCategoriesTable = sqliteTable(
  "repository_categories",
  {
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("repository_categories_pk").on(
      table.repositoryId,
      table.categoryId,
    ),
    index("repository_categories_repository_idx").on(table.repositoryId),
    index("repository_categories_category_idx").on(table.categoryId),
  ],
);

export const repositorySnapshotsTable = sqliteTable(
  "repository_snapshots",
  {
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    recordedAt: text("recorded_at").notNull(),
    openIssues: integer("open_issues").notNull(),
    commitCount30d: integer("commit_count_30d"),
    commitCountTotal: integer("commit_count_total"),
    contributorCount: integer("contributor_count"),
    lastCommitAt: text("last_commit_at"),
    lastReleaseAt: text("last_release_at"),
    releaseCount: integer("release_count"),
    starCount: integer("star_count"),
    forkCount: integer("fork_count"),
    distinctCommitters90d: integer("distinct_committers_90d"),
    topContributorRatio90d: integer("top_contributor_ratio_90d"),
    healthScoreVersion: integer("health_score_version"),
  },
  (table) => [
    uniqueIndex("repository_snapshots_pk").on(
      table.repositoryId,
      table.recordedAt,
    ),
    index("repository_snapshots_recorded_idx").on(table.recordedAt),
  ],
);

export const repositoryPackageMappingsTable = sqliteTable(
  "repository_package_mappings",
  {
    repositoryId: text("repository_id")
      .primaryKey()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    packageName: text("package_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("repository_package_mappings_source_idx").on(table.source),
    check(
      "repository_package_mappings_source_check",
      sql`${table.source} IN ('npm', 'maven-central', 'pypi', 'homebrew', 'docker')`,
    ),
  ],
);

export const adoptionSnapshotsTable = sqliteTable(
  "adoption_snapshots",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    packageName: text("package_name").notNull(),
    weeklyDownloads: integer("weekly_downloads"),
    downloadsDelta7d: integer("downloads_delta_7d"),
    downloadsDelta30d: integer("downloads_delta_30d"),
    lastPublishedAt: text("last_published_at"),
    latestVersion: text("latest_version"),
    deprecated: integer("deprecated", { mode: "boolean" }),
    fetchStatus: text("fetch_status").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("adoption_snapshots_repository_fetched_idx").on(
      table.repositoryId,
      table.fetchedAt,
    ),
    index("adoption_snapshots_source_idx").on(table.source),
    check(
      "adoption_snapshots_source_check",
      sql`${table.source} IN ('npm', 'maven-central', 'pypi', 'homebrew', 'docker')`,
    ),
    check(
      "adoption_snapshots_fetch_status_check",
      sql`${table.fetchStatus} IN ('succeeded', 'failed')`,
    ),
  ],
);
