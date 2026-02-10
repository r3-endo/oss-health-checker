import { ApplicationError } from "../errors/application-error";
import type { RepositoryReadModelPort } from "../ports/repository-read-model-port";
import type { RepositoryWithLatestSnapshot } from "../read-models/repository-with-latest-snapshot";

export interface ListRepositoriesWithLatestSnapshotUseCase {
  execute(): Promise<readonly RepositoryWithLatestSnapshot[]>;
}

export class ListRepositoriesWithLatestSnapshotService implements ListRepositoriesWithLatestSnapshotUseCase {
  constructor(
    private readonly repositoryReadModelPort: RepositoryReadModelPort,
  ) {}

  async execute(): Promise<readonly RepositoryWithLatestSnapshot[]> {
    try {
      return await this.repositoryReadModelPort.listWithLatestSnapshot();
    } catch (error) {
      throw new ApplicationError(
        "INTERNAL_ERROR",
        "Failed to list repositories",
        {
          cause: error instanceof Error ? error.message : "unknown",
        },
      );
    }
  }
}
