import type { RepositorySnapshot } from "../../domain/models/snapshot.js";
import { ApplicationError } from "../errors/application-error.js";
import {
  RepositoryGatewayError,
  type RepositoryGatewayPort,
} from "../ports/repository-gateway-port.js";
import type { RepositoryPort } from "../ports/repository-port.js";
import type { SnapshotPort } from "../ports/snapshot-port.js";
import { buildSnapshotFromSignals } from "../services/snapshot-factory.js";

export type RefreshRepositoryInput = Readonly<{
  repositoryId: string;
}>;

export type RefreshRepositoryResult = Readonly<{
  ok: true;
  snapshot: RepositorySnapshot;
}>;

export interface RefreshRepositoryUseCase {
  execute(input: RefreshRepositoryInput): Promise<RefreshRepositoryResult>;
}

export class RefreshRepositoryService {
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly snapshotPort: SnapshotPort,
    private readonly repositoryGatewayPort: RepositoryGatewayPort,
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

  async execute(
    input: RefreshRepositoryInput,
  ): Promise<RefreshRepositoryResult> {
    const repository = await this.repositoryPort.findById(input.repositoryId);
    if (!repository) {
      throw new ApplicationError("NOT_FOUND", "Repository not found");
    }

    try {
      const signals = await this.repositoryGatewayPort.fetchSignals(
        repository.owner,
        repository.name,
      );
      const snapshot = buildSnapshotFromSignals(
        repository.id,
        signals,
        this.now(),
      );
      await this.snapshotPort.insert(snapshot);
      return Object.freeze({ ok: true, snapshot });
    } catch (error: unknown) {
      if (error instanceof RepositoryGatewayError) {
        if (error.code === "RATE_LIMIT") {
          throw new ApplicationError("RATE_LIMIT", error.message, {
            ...RefreshRepositoryService.buildRateLimitDetail(
              error.detail?.status,
              error.detail?.retryAfterSeconds ?? null,
            ),
          });
        }

        throw new ApplicationError(
          "EXTERNAL_API_ERROR",
          error.message,
          RefreshRepositoryService.buildExternalApiDetail(error.detail?.status),
        );
      }

      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError("INTERNAL_ERROR", "Failed to refresh", {
        cause: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
