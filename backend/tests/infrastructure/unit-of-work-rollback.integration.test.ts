import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { UnitOfWorkPort } from "../../src/application/ports/unit-of-work-port";
import type { DrizzleDatabaseHandle } from "../../src/infrastructure/db/drizzle/client";
import { createDrizzleHandle } from "../../src/infrastructure/db/drizzle/client";
import { migrateDrizzleDatabase } from "../../src/infrastructure/db/drizzle/migrate";
import { DrizzleUnitOfWorkAdapter } from "../../src/infrastructure/repositories/drizzle-unit-of-work-adapter";
import {
  repositoriesTable,
  snapshotsTable,
} from "../../src/infrastructure/db/drizzle/schema";
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
