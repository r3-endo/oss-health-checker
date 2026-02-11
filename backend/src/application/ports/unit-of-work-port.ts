import type { Repository } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";
import type { CreateRepositoryInput } from "./repository-port";

export interface TransactionRepositoryPort {
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
