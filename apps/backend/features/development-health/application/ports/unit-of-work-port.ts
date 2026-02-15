import type { Repository } from "@oss-health-checker/common/features/development-health/domain/models/repository.js";
import type { RepositorySnapshot } from "@oss-health-checker/common/features/development-health/domain/models/snapshot.js";
import type { CreateRepositoryInput } from "@oss-health-checker/common/features/development-health/application/ports/repository-port.js";

export interface TransactionRepositoryPort {
  findByUrl(url: string): Repository | null;
  createWithLimit(input: CreateRepositoryInput, limit: number): Repository;
}

export interface TransactionSnapshotPort {
  insert(snapshot: RepositorySnapshot): void;
}

export type TransactionPorts = Readonly<{
  repositoryPort: TransactionRepositoryPort;
  snapshotPort: TransactionSnapshotPort;
}>;

/**
 * Rejects `PromiseLike` at the type level so that `async` callbacks
 * cause a compile-time error instead of silently escaping the
 * synchronous transaction boundary.
 */
type SyncOnly<T> = T extends PromiseLike<unknown> ? never : T;

export interface UnitOfWorkPort {
  runInTransaction<T>(
    work: (ports: TransactionPorts) => SyncOnly<T>,
  ): Promise<T>;
}
