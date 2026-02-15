import type { Repository } from "@oss-health-checker/common/features/development-health/domain/models/repository.js";
import type { RepositorySnapshot } from "@oss-health-checker/common/features/development-health/domain/models/snapshot.js";

export type RepositoryWithLatestSnapshot = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot | null;
}>;
