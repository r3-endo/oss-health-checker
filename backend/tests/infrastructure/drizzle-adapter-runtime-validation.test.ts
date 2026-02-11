import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ApplicationError } from "../../src/application/errors/application-error";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/infrastructure/db/drizzle/client";
import { migrateDrizzleDatabase } from "../../src/infrastructure/db/drizzle/migrate";
import { DrizzleRepositoryReadModelAdapter } from "../../src/infrastructure/repositories/drizzle-repository-read-model-adapter";
import { DrizzleSnapshotAdapter } from "../../src/infrastructure/repositories/drizzle-snapshot-adapter";

const insertRepository = (db: DrizzleDatabaseHandle, id = "r1"): void => {
  const now = Date.now();
  db.sqlite
    .prepare(
      "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      "https://github.com/octocat/Hello-World",
      "octocat",
      "Hello-World",
      now,
      now,
    );
};

const insertSnapshot = (
  db: DrizzleDatabaseHandle,
  status: string,
  id = "s1",
  repositoryId = "r1",
): void => {
  const now = Date.now();
  db.sqlite
    .prepare(
      "INSERT INTO snapshots (id, repository_id, last_commit_at, last_release_at, open_issues_count, contributors_count, status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, repositoryId, now, null, 1, 1, status, now);
};

const insertWarningReason = (
  db: DrizzleDatabaseHandle,
  snapshotId: string,
  reasonKey: string,
): void => {
  db.sqlite
    .prepare(
      "INSERT INTO snapshot_warning_reasons (snapshot_id, reason_key) VALUES (?, ?)",
    )
    .run(snapshotId, reasonKey);
};

describe("drizzle adapter runtime validation", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "adapter-validation-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("fails fast with INTERNAL_ERROR when persisted snapshot status is unknown", async () => {
    insertRepository(db);
    db.sqlite.pragma("ignore_check_constraints = ON");
    insertSnapshot(db, "UnknownStatus");
    db.sqlite.pragma("ignore_check_constraints = OFF");

    const adapter = new DrizzleSnapshotAdapter(db);

    await expect(adapter.findLatestByRepositoryId("r1")).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Invalid persisted snapshot value",
      detail: {
        cause: "unknown snapshot status: UnknownStatus",
      },
    } satisfies Pick<ApplicationError, "code" | "message" | "detail">);
  });

  it("fails fast with INTERNAL_ERROR when persisted warning reason is unknown", async () => {
    insertRepository(db);
    db.sqlite.pragma("ignore_check_constraints = ON");
    insertSnapshot(db, "Active");
    insertWarningReason(db, "s1", "unknown_reason");
    db.sqlite.pragma("ignore_check_constraints = OFF");

    const adapter = new DrizzleRepositoryReadModelAdapter(db);

    await expect(adapter.listWithLatestSnapshot()).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Invalid persisted snapshot value",
      detail: {
        cause: "unknown warning reason: unknown_reason",
      },
    } satisfies Pick<ApplicationError, "code" | "message" | "detail">);
  });
});
