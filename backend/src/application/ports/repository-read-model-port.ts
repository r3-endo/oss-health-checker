import type { RepositoryWithLatestSnapshot } from "../read-models/repository-with-latest-snapshot";

export interface RepositoryReadModelPort {
  listWithLatestSnapshot(): Promise<readonly RepositoryWithLatestSnapshot[]>;
}
