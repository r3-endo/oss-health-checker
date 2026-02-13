import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/shared/infrastructure/db/drizzle/migrate.js";

describe("adoption schema migration", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "adoption-schema-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates repository_package_mappings and adoption_snapshots with constraints", () => {
    db.sqlite
      .prepare(
        "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("repo-1", "https://github.com/acme/repo", "acme", "repo", 1, 1);

    db.sqlite
      .prepare(
        "INSERT INTO repository_package_mappings (repository_id, source, package_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("repo-1", "npm", "@acme/repo", 1, 1);

    db.sqlite
      .prepare(
        "INSERT INTO adoption_snapshots (id, repository_id, source, package_name, weekly_downloads, downloads_delta_7d, downloads_delta_30d, last_published_at, latest_version, fetch_status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        "adp-1",
        "repo-1",
        "npm",
        "@acme/repo",
        1200,
        null,
        null,
        null,
        null,
        "succeeded",
        1,
      );

    expect(() =>
      db.sqlite
        .prepare(
          "INSERT INTO adoption_snapshots (id, repository_id, source, package_name, weekly_downloads, downloads_delta_7d, downloads_delta_30d, last_published_at, latest_version, fetch_status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          "adp-2",
          "repo-1",
          "invalid-source",
          "@acme/repo",
          null,
          null,
          null,
          null,
          null,
          "failed",
          2,
        ),
    ).toThrow();

    expect(() =>
      db.sqlite
        .prepare(
          "INSERT INTO repository_package_mappings (repository_id, source, package_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        )
        .run("repo-missing", "npm", "@acme/repo", 1, 1),
    ).toThrow();
  });
});
