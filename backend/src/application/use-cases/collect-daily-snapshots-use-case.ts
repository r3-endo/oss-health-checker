import { ApplicationError } from "../errors/application-error.js";
import {
  RepositoryGatewayError,
  type RepositoryGatewayPort,
} from "../ports/repository-gateway-port.js";
import type { RepositoryPort } from "../ports/repository-port.js";
import type {
  RepositorySignalUpdatePort,
  SignalUpdateResult,
} from "../ports/repository-signal-update-port.js";
import type { RepositorySnapshotWritePort } from "../ports/repository-snapshot-write-port.js";

type RepositoryRef = Readonly<{
  id: string;
  owner: string;
  name: string;
}>;

export type SnapshotCollectionFailure = Readonly<{
  repositoryId: string;
  code: "RATE_LIMIT" | "EXTERNAL_API_ERROR" | "INTERNAL_ERROR";
  message: string;
}>;

export type CollectDailySnapshotsResult = Readonly<{
  successes: readonly SignalUpdateResult[];
  failures: readonly SnapshotCollectionFailure[];
}>;

export interface CollectDailySnapshotsUseCase {
  executeAll(): Promise<CollectDailySnapshotsResult>;
  executeByRepositoryId(repositoryId: string): Promise<SignalUpdateResult>;
}

const HEALTH_SCORE_VERSION = 1;

const toUtcDayStartIso = (date: Date): string =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ).toISOString();

export class CollectDailySnapshotsService
  implements CollectDailySnapshotsUseCase, RepositorySignalUpdatePort
{
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly repositoryGatewayPort: RepositoryGatewayPort,
    private readonly repositorySnapshotWritePort: RepositorySnapshotWritePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private static buildRateLimitDetail(
    status: number | undefined,
    retryAfterSeconds: number | null | undefined,
  ): Readonly<{ status?: number; retryAfterSeconds?: number | null }> {
    return {
      ...(status !== undefined ? { status } : {}),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    };
  }

  private static buildExternalApiDetail(
    status: number | undefined,
  ): Readonly<{ status?: number }> {
    return status !== undefined ? { status } : {};
  }

  private static normalizeSignalError(error: unknown): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof RepositoryGatewayError) {
      if (error.code === "RATE_LIMIT") {
        return new ApplicationError("RATE_LIMIT", error.message, {
          ...CollectDailySnapshotsService.buildRateLimitDetail(
            error.detail?.status,
            error.detail?.retryAfterSeconds ?? null,
          ),
        });
      }
      return new ApplicationError(
        "EXTERNAL_API_ERROR",
        error.message,
        CollectDailySnapshotsService.buildExternalApiDetail(
          error.detail?.status,
        ),
      );
    }

    return new ApplicationError("INTERNAL_ERROR", "Failed to collect snapshot", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }

  private async collectForRepository(
    repository: RepositoryRef,
  ): Promise<SignalUpdateResult> {
    const signals = await this.repositoryGatewayPort.fetchSignals(
      repository.owner,
      repository.name,
    );
    const collectedAt = this.now();
    await this.repositorySnapshotWritePort.upsertSnapshot({
      repositoryId: repository.id,
      recordedAt: toUtcDayStartIso(collectedAt),
      openIssues: signals.openIssuesCount,
      commitCount30d: null,
      contributorCount: signals.contributorsCount,
      lastCommitAt: signals.lastCommitAt.toISOString(),
      lastReleaseAt: signals.lastReleaseAt?.toISOString() ?? null,
      healthScoreVersion: HEALTH_SCORE_VERSION,
    });
    return Object.freeze({
      repositoryId: repository.id,
      updated: true,
    });
  }

  async executeByRepositoryId(repositoryId: string): Promise<SignalUpdateResult> {
    const repository = await this.repositoryPort.findById(repositoryId);
    if (!repository) {
      throw new ApplicationError("NOT_FOUND", "Repository not found");
    }

    try {
      return await this.collectForRepository(repository);
    } catch (error) {
      throw CollectDailySnapshotsService.normalizeSignalError(error);
    }
  }

  async executeAll(): Promise<CollectDailySnapshotsResult> {
    const repositories = await this.repositoryPort.list();
    const successes: SignalUpdateResult[] = [];
    const failures: SnapshotCollectionFailure[] = [];

    for (const repository of repositories) {
      try {
        const result = await this.collectForRepository(repository);
        successes.push(result);
      } catch (error) {
        const applicationError =
          CollectDailySnapshotsService.normalizeSignalError(error);

        const codeByError: Record<
          ApplicationError["code"],
          "RATE_LIMIT" | "EXTERNAL_API_ERROR" | "INTERNAL_ERROR"
        > = {
          VALIDATION_ERROR: "INTERNAL_ERROR",
          NOT_FOUND: "INTERNAL_ERROR",
          RATE_LIMIT: "RATE_LIMIT",
          EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
          INTERNAL_ERROR: "INTERNAL_ERROR",
        };

        failures.push({
          repositoryId: repository.id,
          code: codeByError[applicationError.code],
          message: applicationError.message,
        });
      }
    }

    return Object.freeze({
      successes,
      failures,
    });
  }

  async refreshByRepositoryId(repositoryId: string): Promise<SignalUpdateResult> {
    return this.executeByRepositoryId(repositoryId);
  }

  async refreshAll(): Promise<readonly SignalUpdateResult[]> {
    const result = await this.executeAll();
    return result.successes;
  }
}
