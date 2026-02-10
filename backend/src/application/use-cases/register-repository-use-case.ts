import type { Repository } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";
import { ApplicationError } from "../errors/application-error";
import type { RepositoryGatewayPort } from "../ports/repository-gateway-port";
import { RepositoryGatewayError } from "../ports/repository-gateway-port";
import {
  RepositoryAlreadyExistsError,
  RepositoryLimitExceededError,
  type RepositoryPort,
} from "../ports/repository-port";
import type { SnapshotPort } from "../ports/snapshot-port";
import {
  GitHubRepositoryUrlError,
  parseGitHubRepositoryUrl,
} from "../services/github-repository-url";
import { buildSnapshotFromSignals } from "../services/snapshot-factory";

export type RegisterRepositoryInput = Readonly<{
  url: string;
}>;

export type RegisterRepositoryResult = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot;
}>;

export interface RegisterRepositoryUseCase {
  execute(input: RegisterRepositoryInput): Promise<RegisterRepositoryResult>;
}

const MAX_REPOSITORY_COUNT = 3;

export class RegisterRepositoryService {
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly snapshotPort: SnapshotPort,
    private readonly repositoryGatewayPort: RepositoryGatewayPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: RegisterRepositoryInput,
  ): Promise<RegisterRepositoryResult> {
    try {
      const parsed = parseGitHubRepositoryUrl(input.url);

      const signals = await this.repositoryGatewayPort.fetchSignals(
        parsed.owner,
        parsed.name,
      );

      const repository = await this.repositoryPort.createWithLimit(
        {
          url: parsed.normalizedUrl,
          owner: parsed.owner,
          name: parsed.name,
        },
        MAX_REPOSITORY_COUNT,
      );

      const snapshot = buildSnapshotFromSignals(
        repository.id,
        signals,
        this.now(),
      );
      await this.snapshotPort.insert(snapshot);

      return Object.freeze({
        repository,
        snapshot,
      });
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      if (error instanceof GitHubRepositoryUrlError) {
        throw new ApplicationError("VALIDATION_ERROR", error.message);
      }

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

      if (error instanceof RepositoryLimitExceededError) {
        throw new ApplicationError("VALIDATION_ERROR", error.message, {
          limit: error.limit,
        });
      }

      if (error instanceof RepositoryAlreadyExistsError) {
        throw new ApplicationError("VALIDATION_ERROR", error.message, {
          reason: "duplicate_repository_url",
        });
      }

      throw new ApplicationError("INTERNAL_ERROR", "Failed to register", {
        cause: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
