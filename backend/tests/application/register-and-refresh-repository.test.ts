import { describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@oss-health-checker/common/features/development-health/application/errors/application-error.js";
import { RepositoryGatewayError } from "@oss-health-checker/common/features/development-health/application/ports/repository-gateway-port.js";
import { type RepositoryPort } from "@oss-health-checker/common/features/development-health/application/ports/repository-port.js";
import type { SnapshotPort } from "@oss-health-checker/common/features/development-health/application/ports/snapshot-port.js";
import type { RepositoryGatewayPort } from "@oss-health-checker/common/features/development-health/application/ports/repository-gateway-port.js";
import type {
  UnitOfWorkPort,
  TransactionPorts,
  TransactionRepositoryPort,
  TransactionSnapshotPort,
} from "@backend/features/development-health/application/ports/unit-of-work-port.js";
import { RegisterRepositoryService } from "@backend/features/development-health/application/use-cases/register-repository-use-case.js";
import { RefreshRepositoryService } from "@backend/features/development-health/application/use-cases/refresh-repository-use-case.js";
import type { Repository } from "@oss-health-checker/common/features/development-health/domain/models/repository.js";
import type { RepositorySnapshot } from "@oss-health-checker/common/features/development-health/domain/models/snapshot.js";

const buildRepository = (): Repository => ({
  id: "repo-1",
  url: "https://github.com/octocat/Hello-World",
  owner: "octocat",
  name: "Hello-World",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
});

const buildMockUnitOfWork = (overrides?: {
  repositoryPort?: Partial<TransactionRepositoryPort>;
  snapshotPort?: Partial<TransactionSnapshotPort>;
}): UnitOfWorkPort => {
  const repository = buildRepository();
  const txRepositoryPort: TransactionRepositoryPort = {
    findByUrl: overrides?.repositoryPort?.findByUrl ?? (() => null),
    createWithLimit:
      overrides?.repositoryPort?.createWithLimit ?? (() => repository),
  };
  const txSnapshotPort: TransactionSnapshotPort = {
    insert: overrides?.snapshotPort?.insert ?? (() => undefined),
  };
  return {
    async runInTransaction<T>(
      work: (ports: TransactionPorts) => T,
    ): Promise<T> {
      return work({
        repositoryPort: txRepositoryPort,
        snapshotPort: txSnapshotPort,
      });
    },
  };
};

describe("repository signal ingestion use-cases", () => {
  it("creates initial snapshot immediately after repository registration", async () => {
    const repository = buildRepository();
    const snapshotInsert = vi.fn<(snapshot: RepositorySnapshot) => void>();

    const unitOfWork = buildMockUnitOfWork({
      repositoryPort: { createWithLimit: () => repository },
      snapshotPort: { insert: snapshotInsert },
    });

    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => ({
        lastCommitAt: new Date("2025-12-31T00:00:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 12,
        contributorsCount: 3,
      })),
    };

    const useCase = new RegisterRepositoryService(
      unitOfWork,
      repositoryGateway,
    );

    const result = await useCase.execute({
      url: "https://github.com/octocat/Hello-World",
    });

    expect(result.repository.id).toBe("repo-1");
    expect(snapshotInsert).toHaveBeenCalledTimes(1);
    const firstCall = snapshotInsert.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("snapshot insert call is missing");
    }
    const snapshot = firstCall[0];
    expect(snapshot.repositoryId).toBe("repo-1");
    expect(snapshot.status).toBe("Active");
    expect(snapshot.warningReasons).toEqual([]);
  });

  it("does not create repository when initial fetch fails", async () => {
    const createWithLimit = vi.fn(() => buildRepository());

    const unitOfWork = buildMockUnitOfWork({
      repositoryPort: { createWithLimit },
    });

    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => {
        throw new RepositoryGatewayError("API_ERROR", "upstream failed");
      }),
    };

    const useCase = new RegisterRepositoryService(
      unitOfWork,
      repositoryGateway,
    );

    await expect(
      useCase.execute({
        url: "https://github.com/octocat/Hello-World",
      }),
    ).rejects.toMatchObject({
      name: "ApplicationError",
      code: "EXTERNAL_API_ERROR",
      message: "upstream failed",
    });
    expect(createWithLimit).not.toHaveBeenCalled();
  });

  it("reuses existing repository when URL is already seeded", async () => {
    const repository = buildRepository();
    const snapshotInsert = vi.fn<(snapshot: RepositorySnapshot) => void>();
    const unitOfWork = buildMockUnitOfWork({
      repositoryPort: {
        findByUrl: () => repository,
      },
      snapshotPort: { insert: snapshotInsert },
    });

    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => ({
        lastCommitAt: new Date("2025-12-31T00:00:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 12,
        contributorsCount: 3,
      })),
    };

    const useCase = new RegisterRepositoryService(
      unitOfWork,
      repositoryGateway,
    );

    const result = await useCase.execute({
      url: "https://github.com/octocat/Hello-World",
    });

    expect(result.repository.id).toBe(repository.id);
    expect(snapshotInsert).toHaveBeenCalledTimes(1);
  });

  it("throws rate-limit ApplicationError and keeps previous snapshot when refresh fails", async () => {
    const repository = buildRepository();

    const repositoryPort: RepositoryPort = {
      create: vi.fn(async () => repository),
      createWithLimit: vi.fn(async () => repository),
      list: vi.fn(async () => [repository]),
      findByUrl: vi.fn(async () => repository),
      findById: vi.fn(async () => repository),
      count: vi.fn(async () => 1),
    };

    const snapshotInsert = vi.fn<
      (snapshot: RepositorySnapshot) => Promise<void>
    >(async () => undefined);
    const latestSnapshot: RepositorySnapshot = {
      repositoryId: repository.id,
      lastCommitAt: new Date("2025-01-01T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 99,
      contributorsCount: 5,
      status: "Stale",
      warningReasons: ["commit_stale"],
      fetchedAt: new Date("2025-01-02T00:00:00Z"),
    };
    const snapshotPort: SnapshotPort = {
      insert: snapshotInsert,
      findLatestByRepositoryId: vi.fn(async () => latestSnapshot),
      findLatestForAllRepositories: vi.fn(async () => []),
    };

    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => {
        throw new RepositoryGatewayError("RATE_LIMIT", "rate limit", {
          retryAfterSeconds: 60,
        });
      }),
    };

    const repositorySnapshotWritePort = {
      upsertSnapshot: vi.fn(async () => undefined),
    };

    const useCase = new RefreshRepositoryService(
      repositoryPort,
      snapshotPort,
      repositorySnapshotWritePort,
      repositoryGateway,
    );

    const execution = useCase.execute({ repositoryId: repository.id });

    await expect(execution).rejects.toMatchObject({
      name: "ApplicationError",
      code: "RATE_LIMIT",
      message: "rate limit",
      detail: {
        retryAfterSeconds: 60,
      },
    });
    expect(snapshotInsert).not.toHaveBeenCalled();
    expect(repositorySnapshotWritePort.upsertSnapshot).not.toHaveBeenCalled();
  });

  it("upserts repository_snapshots with UTC day when refresh succeeds", async () => {
    const repository = buildRepository();
    const repositoryPort: RepositoryPort = {
      create: vi.fn(async () => repository),
      createWithLimit: vi.fn(async () => repository),
      list: vi.fn(async () => [repository]),
      findByUrl: vi.fn(async () => repository),
      findById: vi.fn(async () => repository),
      count: vi.fn(async () => 1),
    };
    const snapshotPort: SnapshotPort = {
      insert: vi.fn(async () => undefined),
      findLatestByRepositoryId: vi.fn(async () => null),
      findLatestForAllRepositories: vi.fn(async () => []),
    };
    const repositorySnapshotWritePort = {
      upsertSnapshot: vi.fn(async () => undefined),
    };
    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => ({
        lastCommitAt: new Date("2026-02-05T10:30:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 10,
        contributorsCount: 5,
      })),
    };

    const useCase = new RefreshRepositoryService(
      repositoryPort,
      snapshotPort,
      repositorySnapshotWritePort,
      repositoryGateway,
      () => new Date("2026-02-06T12:34:56Z"),
    );

    await useCase.execute({ repositoryId: repository.id });

    expect(repositorySnapshotWritePort.upsertSnapshot).toHaveBeenCalledWith({
      repositoryId: repository.id,
      recordedAt: "2026-02-06T00:00:00.000Z",
      openIssues: 10,
      commitCount30d: null,
      contributorCount: 5,
      lastCommitAt: "2026-02-05T10:30:00.000Z",
      lastReleaseAt: null,
      healthScoreVersion: 1,
    });
  });

  it("maps non-rate-limit gateway failure to EXTERNAL_API_ERROR", async () => {
    const repository = buildRepository();
    const repositoryPort: RepositoryPort = {
      create: vi.fn(async () => repository),
      createWithLimit: vi.fn(async () => repository),
      list: vi.fn(async () => [repository]),
      findByUrl: vi.fn(async () => repository),
      findById: vi.fn(async () => repository),
      count: vi.fn(async () => 1),
    };
    const snapshotPort: SnapshotPort = {
      insert: vi.fn(async () => undefined),
      findLatestByRepositoryId: vi.fn(async () => null),
      findLatestForAllRepositories: vi.fn(async () => []),
    };
    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => {
        throw new RepositoryGatewayError("API_ERROR", "upstream failed", {
          status: 502,
        });
      }),
    };

    const useCase = new RefreshRepositoryService(
      repositoryPort,
      snapshotPort,
      {
        upsertSnapshot: vi.fn(async () => undefined),
      },
      repositoryGateway,
    );

    await expect(
      useCase.execute({
        repositoryId: repository.id,
      }),
    ).rejects.toMatchObject({
      name: "ApplicationError",
      code: "EXTERNAL_API_ERROR",
      message: "upstream failed",
      detail: {
        status: 502,
      },
    });
  });

  it("maps unexpected refresh failure to INTERNAL_ERROR", async () => {
    const repository = buildRepository();
    const repositoryPort: RepositoryPort = {
      create: vi.fn(async () => repository),
      createWithLimit: vi.fn(async () => repository),
      list: vi.fn(async () => [repository]),
      findByUrl: vi.fn(async () => repository),
      findById: vi.fn(async () => repository),
      count: vi.fn(async () => 1),
    };
    const snapshotPort: SnapshotPort = {
      insert: vi.fn(async () => undefined),
      findLatestByRepositoryId: vi.fn(async () => null),
      findLatestForAllRepositories: vi.fn(async () => []),
    };
    const repositoryGateway: RepositoryGatewayPort = {
      fetchSignals: vi.fn(async () => {
        throw new Error("boom");
      }),
    };

    const useCase = new RefreshRepositoryService(
      repositoryPort,
      snapshotPort,
      {
        upsertSnapshot: vi.fn(async () => undefined),
      },
      repositoryGateway,
    );

    await expect(
      useCase.execute({
        repositoryId: repository.id,
      }),
    ).rejects.toEqual(
      new ApplicationError("INTERNAL_ERROR", "Failed to refresh", {
        cause: "boom",
      }),
    );
  });
});
