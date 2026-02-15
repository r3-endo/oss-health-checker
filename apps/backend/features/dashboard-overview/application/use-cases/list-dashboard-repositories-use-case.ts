import { ApplicationError } from "@oss-health-checker/common/features/development-health/application/errors/application-error.js";
import type { RepositoryReadModelPort } from "../../../development-health/application/ports/repository-read-model-port.js";
import type { RepositoryAdoptionReadPort } from "../../../ecosystem-adoption/application/ports/repository-adoption-read-port.js";
import type { DashboardRepositoryRow } from "../read-models/dashboard-repository-row.js";

export interface ListDashboardRepositoriesUseCase {
  execute(): Promise<readonly DashboardRepositoryRow[]>;
}

export class ListDashboardRepositoriesService implements ListDashboardRepositoriesUseCase {
  constructor(
    private readonly repositoryReadModelPort: RepositoryReadModelPort,
    private readonly adoptionReadPort: RepositoryAdoptionReadPort,
  ) {}

  async execute(): Promise<readonly DashboardRepositoryRow[]> {
    try {
      const repositories =
        await this.repositoryReadModelPort.listWithLatestSnapshot();

      const rows = await Promise.all(
        repositories.map(async (item) =>
          Object.freeze({
            repository: item.repository,
            snapshot: item.snapshot,
            adoption: await this.adoptionReadPort.getByRepositoryId(
              item.repository.id,
            ),
          }),
        ),
      );

      return rows;
    } catch (error) {
      throw new ApplicationError(
        "INTERNAL_ERROR",
        "Failed to list dashboard repositories",
        {
          cause: error instanceof Error ? error.message : "unknown",
        },
      );
    }
  }
}
