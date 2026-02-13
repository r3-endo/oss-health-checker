import type { Repository } from "../../../development-health/domain/models/repository.js";
import type { RepositorySnapshot } from "../../../development-health/domain/models/snapshot.js";
import type { RepositoryAdoption } from "../../../ecosystem-adoption/domain/models/adoption.js";

export type DashboardRepositoryRow = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot | null;
  adoption: RepositoryAdoption;
}>;
