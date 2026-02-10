import type { DrizzleDatabaseHandle } from "./client";

export const migrateDrizzleDatabase = (handle: DrizzleDatabaseHandle): void => {
  handle.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY NOT NULL,
      url TEXT NOT NULL,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS repositories_url_unique
      ON repositories (url);

    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      repository_id TEXT NOT NULL,
      last_commit_at INTEGER NOT NULL,
      last_release_at INTEGER,
      open_issues_count INTEGER NOT NULL,
      contributors_count INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Active', 'Stale', 'Risky')),
      fetched_at INTEGER NOT NULL,
      FOREIGN KEY (repository_id)
        REFERENCES repositories(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS snapshots_repository_fetched_idx
      ON snapshots (repository_id, fetched_at);

    CREATE TABLE IF NOT EXISTS snapshot_warning_reasons (
      snapshot_id TEXT NOT NULL,
      reason_key TEXT NOT NULL CHECK (reason_key IN ('commit_stale', 'release_stale', 'open_issues_high')),
      PRIMARY KEY (snapshot_id, reason_key),
      FOREIGN KEY (snapshot_id)
        REFERENCES snapshots(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS snapshot_warning_reasons_reason_idx
      ON snapshot_warning_reasons (reason_key);
  `);
};
