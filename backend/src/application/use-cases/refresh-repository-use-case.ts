import type { RepositorySnapshot } from "../../domain/models/snapshot";
import { ApplicationError } from "../errors/application-error";
import {
  RepositoryGatewayError,
  type RepositoryGatewayPort,
} from "../ports/repository-gateway-port";
import type { RepositoryPort } from "../ports/repository-port";
import type { SnapshotPort } from "../ports/snapshot-port";
import { buildSnapshotFromSignals } from "../services/snapshot-factory";

export type RefreshRepositoryInput = Readonly<{
  repositoryId: string;
}>;

export type RefreshRepositoryResult =
  | Readonly<{
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
            status: error.detail?.status,
            retryAfterSeconds: error.detail?.retryAfterSeconds ?? null,
          });
        }

        throw new ApplicationError("EXTERNAL_API_ERROR", error.message, {
          status: error.detail?.status,
        });
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
