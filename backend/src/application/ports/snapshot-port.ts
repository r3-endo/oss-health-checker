import type { RepositoryId } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";

export interface SnapshotPort {
  insert(snapshot: RepositorySnapshot): Promise<void>;
  findLatestByRepositoryId(
    repositoryId: RepositoryId,
  ): Promise<RepositorySnapshot | null>;
  findLatestForAllRepositories(): Promise<readonly RepositorySnapshot[]>;
}
