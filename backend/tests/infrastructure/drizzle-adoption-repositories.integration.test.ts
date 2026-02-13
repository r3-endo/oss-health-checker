import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleAdoptionSnapshotAdapter } from "../../src/features/ecosystem-adoption/infrastructure/repositories/drizzle-adoption-snapshot-adapter.js";
import { DrizzleRepositoryPackageMappingAdapter } from "../../src/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-package-mapping-adapter.js";

describe("adoption drizzle repositories", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "adoption-repo-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);

    db.sqlite
      .prepare(
        "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("repo-1", "https://github.com/acme/repo", "acme", "repo", 1, 1);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("upserts package mapping and reads it back", async () => {
    const adapter = new DrizzleRepositoryPackageMappingAdapter(db);

    await adapter.upsert({
      repositoryId: "repo-1",
      source: "npm",
      packageName: "@acme/repo",
      now: new Date("2026-02-13T00:00:00.000Z"),
    });

    const mapping = await adapter.findByRepositoryId("repo-1");
    expect(mapping?.source).toBe("npm");
    expect(mapping?.packageName).toBe("@acme/repo");
  });

  it("saves and fetches the latest adoption snapshot", async () => {
    const adapter = new DrizzleAdoptionSnapshotAdapter(db);

    await adapter.save({
      repositoryId: "repo-1",
      source: "npm",
      packageName: "@acme/repo",
      weeklyDownloads: 100,
      downloadsDelta7d: 10,
      downloadsDelta30d: 20,
      lastPublishedAt: "2026-02-01T00:00:00.000Z",
      latestVersion: "1.2.3",
      deprecated: false,
      fetchStatus: "succeeded",
      fetchedAt: new Date("2026-02-13T00:00:00.000Z"),
    });

    await adapter.save({
      repositoryId: "repo-1",
      source: "npm",
      packageName: "@acme/repo",
      weeklyDownloads: 200,
      downloadsDelta7d: 20,
      downloadsDelta30d: 40,
      lastPublishedAt: "2026-02-10T00:00:00.000Z",
      latestVersion: "1.2.4",
      deprecated: false,
      fetchStatus: "failed",
      fetchedAt: new Date("2026-02-14T00:00:00.000Z"),
    });

    const latest = await adapter.findLatestByRepositoryId("repo-1");
    expect(latest?.weeklyDownloads).toBe(200);
    expect(latest?.fetchStatus).toBe("failed");
  });

  it("fails when snapshot is saved for unknown repository", async () => {
    const adapter = new DrizzleAdoptionSnapshotAdapter(db);

    await expect(
      adapter.save({
        repositoryId: "unknown",
        source: "npm",
        packageName: "@acme/repo",
        weeklyDownloads: null,
        downloadsDelta7d: null,
        downloadsDelta30d: null,
        lastPublishedAt: null,
        latestVersion: null,
        deprecated: null,
        fetchStatus: "failed",
        fetchedAt: new Date("2026-02-14T00:00:00.000Z"),
      }),
    ).rejects.toThrow();
  });
});
