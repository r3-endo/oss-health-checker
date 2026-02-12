import type { Repository } from "../../domain/models/repository.js";
import type { RepositorySnapshot } from "../../domain/models/snapshot.js";
import { ApplicationError } from "../errors/application-error.js";
import type { RepositoryGatewayPort } from "../ports/repository-gateway-port.js";
import { RepositoryGatewayError } from "../ports/repository-gateway-port.js";
import {
  RepositoryAlreadyExistsError,
  RepositoryLimitExceededError,
} from "../ports/repository-port.js";
import type { UnitOfWorkPort } from "../ports/unit-of-work-port.js";
import {
  GitHubRepositoryUrlError,
  parseGitHubRepositoryUrl,
} from "../services/github-repository-url.js";
import { buildSnapshotFromSignals } from "../services/snapshot-factory.js";

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
    private readonly unitOfWorkPort: UnitOfWorkPort,
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
    input: RegisterRepositoryInput,
  ): Promise<RegisterRepositoryResult> {
    try {
      const parsed = parseGitHubRepositoryUrl(input.url);

      const signals = await this.repositoryGatewayPort.fetchSignals(
        parsed.owner,
        parsed.name,
      );

      const result = await this.unitOfWorkPort.runInTransaction((tx) => {
        const repository = tx.repositoryPort.createWithLimit(
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
        tx.snapshotPort.insert(snapshot);

        return Object.freeze({ repository, snapshot });
      });

      return result;
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      if (error instanceof GitHubRepositoryUrlError) {
        throw new ApplicationError("VALIDATION_ERROR", error.message);
      }

      if (error instanceof RepositoryGatewayError) {
        if (error.code === "RATE_LIMIT") {
          throw new ApplicationError(
            "RATE_LIMIT",
            error.message,
            RegisterRepositoryService.buildRateLimitDetail(
              error.detail?.status,
              error.detail?.retryAfterSeconds ?? null,
            ),
          );
        }

        throw new ApplicationError(
          "EXTERNAL_API_ERROR",
          error.message,
          RegisterRepositoryService.buildExternalApiDetail(
            error.detail?.status,
          ),
        );
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
