import type { Repository } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";

export type RepositoryWithLatestSnapshot = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot | null;
}>;
