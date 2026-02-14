import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { UnitOfWorkPort } from "@oss-health-checker/common/features/development-health/application/ports/unit-of-work-port.js";
import type { DrizzleDatabaseHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { createDrizzleHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleUnitOfWorkAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import {
  repositoriesTable,
  snapshotsTable,
} from "@oss-health-checker/common/shared/infrastructure/db/drizzle/schema.js";
import { count } from "drizzle-orm";

describe("DrizzleUnitOfWorkAdapter transactional rollback", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;
  let unitOfWork: UnitOfWorkPort;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "uow-test-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);
    unitOfWork = new DrizzleUnitOfWorkAdapter(db);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("commits both repository and snapshot when transaction succeeds", async () => {
    await unitOfWork.runInTransaction((tx) => {
      const repository = tx.repositoryPort.createWithLimit(
        {
          url: "https://github.com/octocat/Hello-World",
          owner: "octocat",
          name: "Hello-World",
        },
        3,
      );

      tx.snapshotPort.insert({
        repositoryId: repository.id,
        lastCommitAt: new Date("2026-01-10T00:00:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 4,
        contributorsCount: 11,
        status: "Active",
        warningReasons: [],
        fetchedAt: new Date("2026-01-11T00:00:00Z"),
      });
    });

    const [repoCount] = await db.db
      .select({ value: count() })
      .from(repositoriesTable);
    const [snapCount] = await db.db
      .select({ value: count() })
      .from(snapshotsTable);
    expect(repoCount?.value).toBe(1);
    expect(snapCount?.value).toBe(1);
  });

  it("rolls back repository when snapshot write fails", async () => {
    await expect(
      unitOfWork.runInTransaction((tx) => {
        tx.repositoryPort.createWithLimit(
          {
            url: "https://github.com/octocat/Hello-World",
            owner: "octocat",
            name: "Hello-World",
          },
          3,
        );

        // Force snapshot insert to fail by using a foreign key that doesn't match
        // the repository we just created (non-existent repo ID violates FK constraint)
        tx.snapshotPort.insert({
          repositoryId: "non-existent-repo-id",
          lastCommitAt: new Date("2026-01-10T00:00:00Z"),
          lastReleaseAt: null,
          openIssuesCount: 4,
          contributorsCount: 11,
          status: "Active",
          warningReasons: [],
          fetchedAt: new Date("2026-01-11T00:00:00Z"),
        });
      }),
    ).rejects.toThrow();

    const [repoCount] = await db.db
      .select({ value: count() })
      .from(repositoriesTable);
    const [snapCount] = await db.db
      .select({ value: count() })
      .from(snapshotsTable);
    expect(repoCount?.value).toBe(0);
    expect(snapCount?.value).toBe(0);
  });

  it("rejects async callbacks that would escape the transaction boundary", async () => {
    await expect(
      unitOfWork.runInTransaction((() => Promise.resolve("oops")) as never),
    ).rejects.toThrow("runInTransaction callback must be synchronous");

    // Ensure no side-effects leaked
    const [repoCount] = await db.db
      .select({ value: count() })
      .from(repositoriesTable);
    expect(repoCount?.value).toBe(0);
  });

  it("rolls back repository when work callback throws after repository creation", async () => {
    await expect(
      unitOfWork.runInTransaction((tx) => {
        tx.repositoryPort.createWithLimit(
          {
            url: "https://github.com/octocat/Hello-World",
            owner: "octocat",
            name: "Hello-World",
          },
          3,
        );

        throw new Error("Simulated snapshot failure");
      }),
    ).rejects.toThrow("Simulated snapshot failure");

    const [repoCount] = await db.db
      .select({ value: count() })
      .from(repositoriesTable);
    expect(repoCount?.value).toBe(0);
  });
});
