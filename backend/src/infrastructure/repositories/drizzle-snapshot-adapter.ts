import type { SnapshotPort } from "../../application/ports/snapshot-port";
import type { RepositoryId } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";
import type { DrizzleDatabaseHandle } from "../db/drizzle/client";

export class DrizzleSnapshotAdapter implements SnapshotPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async insert(_snapshot: RepositorySnapshot): Promise<void> {
    void _snapshot;
    throw new Error(`Not implemented: insert snapshot via ${this.db.kind}`);
  }

  async findLatestByRepositoryId(
    _repositoryId: RepositoryId,
  ): Promise<RepositorySnapshot | null> {
    void _repositoryId;
    throw new Error(
      `Not implemented: find latest snapshot via ${this.db.kind}`,
    );
  }

  async findLatestForAllRepositories(): Promise<readonly RepositorySnapshot[]> {
    throw new Error(
      `Not implemented: find latest snapshots via ${this.db.kind}`,
    );
  }
}
