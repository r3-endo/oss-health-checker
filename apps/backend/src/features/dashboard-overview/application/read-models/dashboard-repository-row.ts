import type { Repository } from "@oss-health-checker/common/features/development-health/domain/models/repository.js";
import type { RepositorySnapshot } from "@oss-health-checker/common/features/development-health/domain/models/snapshot.js";
import type { RepositoryAdoption } from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";

export type DashboardRepositoryRow = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot | null;
  adoption: RepositoryAdoption;
}>;
