import type { RepositoryWithLatestSnapshot } from "../read-models/repository-with-latest-snapshot.js";

export interface RepositoryReadModelPort {
  listWithLatestSnapshot(): Promise<readonly RepositoryWithLatestSnapshot[]>;
}
