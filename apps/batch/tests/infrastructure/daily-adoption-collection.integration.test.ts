import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleRepositoryAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleAdoptionSnapshotAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-adoption-snapshot-adapter.js";
import { DrizzleRepositoryPackageMappingAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-package-mapping-adapter.js";
import { CollectDailyAdoptionSnapshotsService } from "@oss-health-checker/common/features/ecosystem-adoption/application/use-cases/collect-daily-adoption-snapshots-use-case.js";
import { RegistryProviderError } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-port.js";
import type { RegistryProviderResolverPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-resolver-port.js";

describe("daily adoption collection integration", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "daily-adoption-"));
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

  it("persists failed snapshot with previous values when provider fetch fails", async () => {
    const repositoryPort = new DrizzleRepositoryAdapter(db);
    const mappingPort = new DrizzleRepositoryPackageMappingAdapter(db);
    const snapshotPort = new DrizzleAdoptionSnapshotAdapter(db);

    await mappingPort.upsert({
      repositoryId: "repo-1",
      source: "npm",
      packageName: "@acme/repo",
      now: new Date("2026-02-11T00:00:00.000Z"),
    });

    await snapshotPort.save({
      repositoryId: "repo-1",
      source: "npm",
      packageName: "@acme/repo",
      weeklyDownloads: 123,
      downloadsDelta7d: 7,
      downloadsDelta30d: 25,
      lastPublishedAt: "2026-02-10T00:00:00.000Z",
      latestVersion: "1.0.0",
      deprecated: false,
      fetchStatus: "succeeded",
      fetchedAt: new Date("2026-02-12T00:00:00.000Z"),
    });

    const resolverPort: RegistryProviderResolverPort = {
      resolve: () => ({
        source: "npm",
        fetchPackageAdoption: async () => {
          throw new RegistryProviderError("RATE_LIMIT", "rate limited", {
            status: 429,
          });
        },
      }),
    };

    const service = new CollectDailyAdoptionSnapshotsService(
      repositoryPort,
      mappingPort,
      snapshotPort,
      resolverPort,
      () => new Date("2026-02-13T00:00:00.000Z"),
    );

    const result = await service.executeAll();

    expect(result.successes).toEqual([]);
    expect(result.failures).toEqual([
      { repositoryId: "repo-1", code: "RATE_LIMIT", message: "rate limited" },
    ]);

    const latest = await snapshotPort.findLatestByRepositoryId("repo-1");
    expect(latest?.fetchStatus).toBe("failed");
    expect(latest?.weeklyDownloads).toBe(123);
    expect(latest?.latestVersion).toBe("1.0.0");
    expect(latest?.fetchedAt.toISOString()).toBe("2026-02-13T00:00:00.000Z");
  });
});
