import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/shared/infrastructure/db/drizzle/migrate.js";

const createLegacySchemaWithoutMigrationMetadata = (
  db: DrizzleDatabaseHandle,
): void => {
  db.sqlite.exec(`
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

describe("migrateDrizzleDatabase legacy compatibility", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "drizzle-legacy-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("does not replay initial migration on legacy schema without metadata table", () => {
    createLegacySchemaWithoutMigrationMetadata(db);

    expect(() => migrateDrizzleDatabase(db)).not.toThrow();

    const migrationRows = db.sqlite
      .prepare("SELECT COUNT(*) as value FROM __drizzle_migrations")
      .get() as { value: number };
    expect(migrationRows.value).toBeGreaterThan(0);

    const categoryTable = db.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'categories'",
      )
      .get() as { name: string } | undefined;
    const repositorySnapshotsTable = db.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'repository_snapshots'",
      )
      .get() as { name: string } | undefined;

    expect(categoryTable?.name).toBe("categories");
    expect(repositorySnapshotsTable?.name).toBe("repository_snapshots");
  });
});
