import { describe, expect, it, vi } from "vitest";
import { RepositoryGatewayError } from "../../src/features/development-health/application/ports/repository-gateway-port.js";
import type { RepositoryPort } from "../../src/features/development-health/application/ports/repository-port.js";
import type { RepositoryGatewayPort } from "../../src/features/development-health/application/ports/repository-gateway-port.js";
import type { RepositorySnapshotWritePort } from "../../src/features/development-health/application/ports/repository-snapshot-write-port.js";
import { CollectDailySnapshotsService } from "../../src/features/development-health/application/use-cases/collect-daily-snapshots-use-case.js";

describe("CollectDailySnapshotsService", () => {
  it("collects all repositories and allows partial failures", async () => {
    const repositories = [
      {
        id: "r1",
        url: "https://github.com/o1/r1",
        owner: "o1",
        name: "r1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "r2",
        url: "https://github.com/o2/r2",
        owner: "o2",
        name: "r2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as const;

    const repositoryPort: RepositoryPort = {
      create: vi.fn(async () => repositories[0]!),
      createWithLimit: vi.fn(async () => repositories[0]!),
      list: vi.fn(async () => repositories),
      findByUrl: vi.fn(async () => repositories[0]!),
      findById: vi.fn(
        async (id: string) => repositories.find((r) => r.id === id) ?? null,
      ),
      count: vi.fn(async () => repositories.length),
    };
    const repositoryGatewayPort: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async (owner: string) => {
        if (owner === "o2") {
          throw new RepositoryGatewayError("RATE_LIMIT", "rate limited");
        }
        return {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: null,
          openIssuesCount: 5,
          contributorsCount: 3,
        };
      }),
    };
    const repositorySnapshotWritePort: RepositorySnapshotWritePort = {
      upsertSnapshot: vi.fn(async () => undefined),
    };

    const useCase = new CollectDailySnapshotsService(
      repositoryPort,
      repositoryGatewayPort,
      repositorySnapshotWritePort,
      () => new Date("2026-02-11T12:00:00Z"),
    );

    const result = await useCase.executeAll();

    expect(result.successes).toEqual([{ repositoryId: "r1", updated: true }]);
    expect(result.failures).toEqual([
      { repositoryId: "r2", code: "RATE_LIMIT", message: "rate limited" },
    ]);
    expect(repositorySnapshotWritePort.upsertSnapshot).toHaveBeenCalledTimes(1);
  });

  it("does not update snapshot when fetch fails", async () => {
    const repositoryPort: RepositoryPort = {
      create: vi.fn(),
      createWithLimit: vi.fn(),
      list: vi.fn(async () => []),
      findByUrl: vi.fn(),
      findById: vi.fn(async () => ({
        id: "r1",
        url: "https://github.com/o1/r1",
        owner: "o1",
        name: "r1",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      count: vi.fn(),
    };
    const repositoryGatewayPort: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => {
        throw new RepositoryGatewayError("API_ERROR", "upstream failure");
      }),
    };
    const repositorySnapshotWritePort: RepositorySnapshotWritePort = {
      upsertSnapshot: vi.fn(async () => undefined),
    };

    const useCase = new CollectDailySnapshotsService(
      repositoryPort,
      repositoryGatewayPort,
      repositorySnapshotWritePort,
    );

    await expect(useCase.executeByRepositoryId("r1")).rejects.toMatchObject({
      name: "ApplicationError",
      code: "EXTERNAL_API_ERROR",
      message: "upstream failure",
    });
    expect(repositorySnapshotWritePort.upsertSnapshot).not.toHaveBeenCalled();
  });
});
