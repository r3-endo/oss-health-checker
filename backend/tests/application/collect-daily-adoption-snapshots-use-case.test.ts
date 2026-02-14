import { describe, expect, it, vi } from "vitest";
import type { RepositoryPort } from "@oss-health-checker/common/features/development-health/application/ports/repository-port.js";
import { RegistryProviderError } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-port.js";
import type { AdoptionSnapshotPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/adoption-snapshot-port.js";
import type { RepositoryPackageMappingPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/repository-package-mapping-port.js";
import type { RegistryProviderResolverPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-resolver-port.js";
import { CollectDailyAdoptionSnapshotsService } from "@oss-health-checker/common/features/ecosystem-adoption/application/use-cases/collect-daily-adoption-snapshots-use-case.js";

describe("CollectDailyAdoptionSnapshotsService", () => {
  it("collects adoption only for mapped repositories and skips not_mapped repositories", async () => {
    const repositories = [
      {
        id: "repo-1",
        url: "https://github.com/acme/repo-1",
        owner: "acme",
        name: "repo-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "repo-2",
        url: "https://github.com/acme/repo-2",
        owner: "acme",
        name: "repo-2",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ] as const;

    const repositoryPort: RepositoryPort = {
      create: vi.fn(),
      createWithLimit: vi.fn(),
      list: vi.fn(async () => repositories),
      findByUrl: vi.fn(),
      findById: vi.fn(),
      count: vi.fn(),
    };

    const mappingPort: RepositoryPackageMappingPort = {
      findByRepositoryId: vi.fn(async (repositoryId: string) =>
        repositoryId === "repo-1"
          ? {
              repositoryId: "repo-1",
              source: "npm" as const,
              packageName: "pkg-1",
              createdAt: new Date("2026-01-01T00:00:00.000Z"),
              updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            }
          : null,
      ),
      upsert: vi.fn(),
    };

    const snapshotPort: AdoptionSnapshotPort = {
      findLatestByRepositoryId: vi.fn(async () => null),
      save: vi.fn(async (input) => ({
        ...input,
        id: "adp-1",
      })),
    };

    const fetchPackageAdoption = vi.fn(async () => ({
      packageName: "pkg-1",
      weeklyDownloads: 100,
      downloadsDelta7d: 10,
      downloadsDelta30d: 30,
      lastPublishedAt: "2026-02-12T00:00:00.000Z",
      latestVersion: "1.2.3",
      deprecated: false,
    }));

    const resolverPort: RegistryProviderResolverPort = {
      resolve: vi.fn(() => ({
        source: "npm" as const,
        fetchPackageAdoption,
      })),
    };

    const service = new CollectDailyAdoptionSnapshotsService(
      repositoryPort,
      mappingPort,
      snapshotPort,
      resolverPort,
      () => new Date("2026-02-13T00:00:00.000Z"),
    );

    const result = await service.executeAll();

    expect(result.successes).toEqual([
      { repositoryId: "repo-1", updated: true },
    ]);
    expect(result.failures).toEqual([]);
    expect(result.skipped).toEqual([
      { repositoryId: "repo-2", reason: "not_mapped" },
    ]);
    expect(fetchPackageAdoption).toHaveBeenCalledTimes(1);
    expect(snapshotPort.save).toHaveBeenCalledTimes(1);
  });

  it("records failure and persists failed snapshot with previous values when provider fails", async () => {
    const repositoryPort: RepositoryPort = {
      create: vi.fn(),
      createWithLimit: vi.fn(),
      list: vi.fn(async () => [
        {
          id: "repo-1",
          url: "https://github.com/acme/repo-1",
          owner: "acme",
          name: "repo-1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]),
      findByUrl: vi.fn(),
      findById: vi.fn(),
      count: vi.fn(),
    };

    const mappingPort: RepositoryPackageMappingPort = {
      findByRepositoryId: vi.fn(async () => ({
        repositoryId: "repo-1",
        source: "npm" as const,
        packageName: "pkg-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      })),
      upsert: vi.fn(),
    };

    const snapshotPort: AdoptionSnapshotPort = {
      findLatestByRepositoryId: vi.fn(async () => ({
        id: "adp-prev",
        repositoryId: "repo-1",
        source: "npm" as const,
        packageName: "pkg-1",
        weeklyDownloads: 80,
        downloadsDelta7d: 5,
        downloadsDelta30d: 15,
        lastPublishedAt: "2026-02-10T00:00:00.000Z",
        latestVersion: "1.0.0",
        deprecated: false,
        fetchStatus: "succeeded" as const,
        fetchedAt: new Date("2026-02-12T00:00:00.000Z"),
      })),
      save: vi.fn(async (input) => ({
        ...input,
        id: "adp-failed",
      })),
    };

    const resolverPort: RegistryProviderResolverPort = {
      resolve: vi.fn(() => ({
        source: "npm" as const,
        fetchPackageAdoption: vi.fn(async () => {
          throw new RegistryProviderError("RATE_LIMIT", "rate limited", {
            status: 429,
            retryAfterSeconds: 60,
          });
        }),
      })),
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
    expect(snapshotPort.save).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        packageName: "pkg-1",
        weeklyDownloads: 80,
        fetchStatus: "failed",
      }),
    );
  });
});
