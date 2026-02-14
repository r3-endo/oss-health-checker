import type { Repository } from "../../domain/models/repository.js";
import type { RepositorySnapshot } from "../../domain/models/snapshot.js";

export type RepositoryWithLatestSnapshot = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot | null;
}>;
