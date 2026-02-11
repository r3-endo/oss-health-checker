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

export interface UnitOfWorkPort {
  runInTransaction<T>(work: (ports: TransactionPorts) => T): Promise<T>;
}
