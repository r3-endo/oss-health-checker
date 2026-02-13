import { describe, expect, it, vi } from "vitest";
import type { RepositoryPort } from "../../src/features/development-health/application/ports/repository-port.js";
import { ApplicationError } from "../../src/features/ecosystem-adoption/application/errors/application-error.js";
import type { AdoptionSnapshotPort } from "../../src/features/ecosystem-adoption/application/ports/adoption-snapshot-port.js";
import type { RepositoryPackageMappingPort } from "../../src/features/ecosystem-adoption/application/ports/repository-package-mapping-port.js";
import type { RegistryProviderResolverPort } from "../../src/features/ecosystem-adoption/application/ports/registry-provider-resolver-port.js";
import { RegistryProviderError } from "../../src/features/ecosystem-adoption/application/ports/registry-provider-port.js";
import { RefreshRepositoryAdoptionService } from "../../src/features/ecosystem-adoption/application/use-cases/refresh-repository-adoption-use-case.js";

const repositoryPort: RepositoryPort = {
  create: vi.fn(),
  createWithLimit: vi.fn(),
  list: vi.fn(),
  findByUrl: vi.fn(),
  count: vi.fn(),
  findById: vi.fn(async (id: string) =>
    id === "repo-1"
      ? {
          id,
          url: "https://github.com/acme/repo",
          owner: "acme",
          name: "repo",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        }
      : null,
  ),
};

describe("RefreshRepositoryAdoptionService", () => {
  it("returns not_mapped/not_applicable when mapping is missing", async () => {
    const mappingPort: RepositoryPackageMappingPort = {
      findByRepositoryId: vi.fn(async () => null),
      upsert: vi.fn(),
    };
    const snapshotPort: AdoptionSnapshotPort = {
      findLatestByRepositoryId: vi.fn(async () => null),
      save: vi.fn(),
    };
    const resolverPort: RegistryProviderResolverPort = {
      resolve: vi.fn(() => null),
    };

    const service = new RefreshRepositoryAdoptionService(
      repositoryPort,
      mappingPort,
      snapshotPort,
      resolverPort,
    );

    const result = await service.execute({ repositoryId: "repo-1" });

    expect(result.mappingStatus).toBe("not_mapped");
    expect(result.adoptionFetchStatus).toBe("not_applicable");
  });

  it("returns mapped/succeeded and saves snapshot when provider fetch succeeds", async () => {
    const mappingPort: RepositoryPackageMappingPort = {
      findByRepositoryId: vi.fn(async () => ({
        repositoryId: "repo-1",
        source: "npm" as const,
        packageName: "react",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      })),
      upsert: vi.fn(),
    };
    const snapshotPort: AdoptionSnapshotPort = {
      findLatestByRepositoryId: vi.fn(async () => null),
      save: vi.fn(async (input) => ({
        ...input,
        id: "adp-1",
      })),
    };
    const resolverPort: RegistryProviderResolverPort = {
      resolve: vi.fn(() => ({
        source: "npm" as const,
        fetchPackageAdoption: vi.fn(async () => ({
          packageName: "react",
          weeklyDownloads: 100,
          downloadsDelta7d: 11,
          downloadsDelta30d: 40,
          lastPublishedAt: "2026-02-12T00:00:00.000Z",
          latestVersion: "1.0.0",
          deprecated: false,
        })),
      })),
    };

    const service = new RefreshRepositoryAdoptionService(
      repositoryPort,
      mappingPort,
      snapshotPort,
      resolverPort,
      () => new Date("2026-02-13T00:00:00.000Z"),
    );

    const result = await service.execute({ repositoryId: "repo-1" });

    expect(result.mappingStatus).toBe("mapped");
    expect(result.adoptionFetchStatus).toBe("succeeded");
    expect(result.weeklyDownloads).toBe(100);
    expect(snapshotPort.save).toHaveBeenCalledTimes(1);
  });

  it("returns mapped/failed while preserving latest successful snapshot on provider failure", async () => {
    const mappingPort: RepositoryPackageMappingPort = {
      findByRepositoryId: vi.fn(async () => ({
        repositoryId: "repo-1",
        source: "npm" as const,
        packageName: "react",
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
        packageName: "react",
        weeklyDownloads: 90,
        downloadsDelta7d: 4,
        downloadsDelta30d: 20,
        lastPublishedAt: "2026-02-10T00:00:00.000Z",
        latestVersion: "0.9.0",
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
          throw new RegistryProviderError("API_ERROR", "npm failed");
        }),
      })),
    };

    const service = new RefreshRepositoryAdoptionService(
      repositoryPort,
      mappingPort,
      snapshotPort,
      resolverPort,
      () => new Date("2026-02-13T00:00:00.000Z"),
    );

    const result = await service.execute({ repositoryId: "repo-1" });

    expect(result.adoptionFetchStatus).toBe("failed");
    expect(result.weeklyDownloads).toBe(90);
    expect(snapshotPort.save).toHaveBeenCalledTimes(1);
  });

  it("throws NOT_FOUND for unknown repository", async () => {
    const service = new RefreshRepositoryAdoptionService(
      repositoryPort,
      {
        findByRepositoryId: vi.fn(async () => null),
        upsert: vi.fn(),
      },
      {
        findLatestByRepositoryId: vi.fn(async () => null),
        save: vi.fn(),
      },
      {
        resolve: vi.fn(() => null),
      },
    );

    await expect(
      service.execute({ repositoryId: "unknown" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Pick<ApplicationError, "code">);
  });
});
