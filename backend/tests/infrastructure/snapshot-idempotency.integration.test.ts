import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleRepositorySnapshotAdapter } from "../../src/features/development-health/infrastructure/repositories/drizzle-repository-snapshot-adapter.js";
import { repositoriesTable } from "../../src/shared/infrastructure/db/drizzle/schema.js";

describe("Snapshot idempotency", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;
  let adapter: DrizzleRepositorySnapshotAdapter;
  let testRepoId: string;
  const baseSnapshotPayload = {
    contributorCount: null,
    lastCommitAt: null,
    lastReleaseAt: null,
    healthScoreVersion: 1,
  } as const;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "snapshot-idempotency-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);
    adapter = new DrizzleRepositorySnapshotAdapter(db);

    // Insert a test repository
    testRepoId = "test-repo-001";
    db.db
      .insert(repositoriesTable)
      .values({
        id: testRepoId,
        url: "https://github.com/test-owner/test-repo",
        owner: "test-owner",
        name: "test-repo",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      })
      .run();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates exactly 1 row when inserting a snapshot for (repo_id, recorded_at)", async () => {
    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 10,
      commitCount30d: 5,
      ...baseSnapshotPayload,
    });

    const snapshotCount = await adapter.countSnapshots(testRepoId);
    expect(snapshotCount).toBe(1);
  });

  it("still has exactly 1 row after upserting the same (repo_id, recorded_at) with updated data", async () => {
    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 10,
      commitCount30d: 5,
      ...baseSnapshotPayload,
    });

    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 12,
      commitCount30d: 7,
      ...baseSnapshotPayload,
    });

    const snapshotCount = await adapter.countSnapshots(testRepoId);
    expect(snapshotCount).toBe(1);
  });

  it("has the LATEST data after upsert, not the first insert's data", async () => {
    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 10,
      commitCount30d: 5,
      ...baseSnapshotPayload,
    });

    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 12,
      commitCount30d: 7,
      ...baseSnapshotPayload,
    });

    const snapshot = await adapter.getSnapshot(
      testRepoId,
      "2026-01-15T00:00:00Z",
    );
    expect(snapshot).toEqual({
      openIssues: 12,
      commitCount30d: 7,
    });
  });

  it("creates 2 rows when inserting for the same repo but different recorded_at", async () => {
    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 10,
      commitCount30d: 5,
      ...baseSnapshotPayload,
    });

    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-16T00:00:00Z",
      openIssues: 11,
      commitCount30d: 6,
      ...baseSnapshotPayload,
    });

    const snapshotCount = await adapter.countSnapshots(testRepoId);
    expect(snapshotCount).toBe(2);
  });

  it("treats UTC date boundaries as distinct: 2026-01-15 and 2026-01-16 are different", async () => {
    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-15T00:00:00Z",
      openIssues: 10,
      commitCount30d: 5,
      ...baseSnapshotPayload,
    });

    await adapter.upsertSnapshot({
      repositoryId: testRepoId,
      recordedAt: "2026-01-16T00:00:00Z",
      openIssues: 11,
      commitCount30d: 6,
      ...baseSnapshotPayload,
    });

    const snapshot15 = await adapter.getSnapshot(
      testRepoId,
      "2026-01-15T00:00:00Z",
    );
    const snapshot16 = await adapter.getSnapshot(
      testRepoId,
      "2026-01-16T00:00:00Z",
    );

    expect(snapshot15).toEqual({
      openIssues: 10,
      commitCount30d: 5,
    });
    expect(snapshot16).toEqual({
      openIssues: 11,
      commitCount30d: 6,
    });
  });

  it("respects foreign key constraint: inserting snapshot for non-existent repo fails", async () => {
    await expect(
      adapter.upsertSnapshot({
        repositoryId: "non-existent-repo-id",
        recordedAt: "2026-01-15T00:00:00Z",
        openIssues: 10,
        commitCount30d: 5,
        ...baseSnapshotPayload,
      }),
    ).rejects.toThrow();
  });
});
