import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { repositoriesTable } from "./schema.js";

export const repositorySnapshotsTable = sqliteTable(
  "repository_snapshots",
  {
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    recordedAt: text("recorded_at").notNull(), // ISO 8601 UTC date normalized
    openIssues: integer("open_issues").notNull(),
    commitCount30d: integer("commit_count_30d"),
    // Phase 1 future-extensible columns (nullable)
    contributorCount: integer("contributor_count"),
    lastCommitAt: text("last_commit_at"),
    lastReleaseAt: text("last_release_at"),
    starCount: integer("star_count"),
    forkCount: integer("fork_count"),
    healthScoreVersion: integer("health_score_version"),
  },
  (table) => [
    primaryKey({
      columns: [table.repositoryId, table.recordedAt],
    }),
  ],
);
