import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleRepositoryReadModelAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.js";

describe("repository read model non-adoption integration", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "read-model-dev-health-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);

    db.sqlite
      .prepare(
        "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("repo-1", "https://github.com/acme/repo-1", "acme", "repo-1", 1, 1);

    db.sqlite
      .prepare(
        "INSERT INTO snapshots (id, repository_id, last_commit_at, last_release_at, open_issues_count, contributors_count, status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run("snap-1", "repo-1", 1, null, 10, 4, "Active", 1);

    db.sqlite
      .prepare(
        "INSERT INTO repository_package_mappings (repository_id, source, package_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("repo-1", "npm", "pkg-1", 1, 1);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns development-health rows without adoption field", async () => {
    const adapter = new DrizzleRepositoryReadModelAdapter(db);
    const list = await adapter.listWithLatestSnapshot();

    expect(list).toHaveLength(1);
    expect(list[0]?.snapshot?.status).toBe("Active");
    expect("adoption" in (list[0] as object)).toBe(false);
  });
});
