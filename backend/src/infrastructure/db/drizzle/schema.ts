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
  (table) => ({
    repositoriesUrlUnique: uniqueIndex("repositories_url_unique").on(table.url),
  }),
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
  (table) => ({
    snapshotsRepositoryFetchedIndex: index(
      "snapshots_repository_fetched_idx",
    ).on(table.repositoryId, table.fetchedAt),
    snapshotsStatusCheck: check(
      "snapshots_status_check",
      sql`${table.status} IN ('Active', 'Stale', 'Risky')`,
    ),
  }),
);

export const snapshotWarningReasonsTable = sqliteTable(
  "snapshot_warning_reasons",
  {
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => snapshotsTable.id, { onDelete: "cascade" }),
    reasonKey: text("reason_key").notNull(),
  },
  (table) => ({
    snapshotWarningReasonsPk: uniqueIndex("snapshot_warning_reasons_pk").on(
      table.snapshotId,
      table.reasonKey,
    ),
    snapshotWarningReasonsReasonIdx: index(
      "snapshot_warning_reasons_reason_idx",
    ).on(table.reasonKey),
    snapshotWarningReasonsReasonCheck: check(
      "snapshot_warning_reasons_reason_check",
      sql`${table.reasonKey} IN ('commit_stale', 'release_stale', 'open_issues_high')`,
    ),
  }),
);
