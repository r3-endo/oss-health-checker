import {
  RepositoryAlreadyExistsError,
  RepositoryLimitExceededError,
  type CreateRepositoryInput,
} from "../../application/ports/repository-port";
import type {
  TransactionRepositoryPort,
  TransactionSnapshotPort,
  UnitOfWorkPort,
} from "../../application/ports/unit-of-work-port";
import type { Repository } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";
import { count } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "../db/drizzle/client";
import {
  repositoriesTable,
  snapshotsTable,
  snapshotWarningReasonsTable,
} from "../db/drizzle/schema";

type DrizzleTransaction = Parameters<
  Parameters<DrizzleDatabaseHandle["db"]["transaction"]>[0]
>[0];

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Error &&
  /UNIQUE constraint failed: repositories\.url/.test(error.message);

class DrizzleTxRepositoryAdapter implements TransactionRepositoryPort {
  constructor(private readonly tx: DrizzleTransaction) {}

  createWithLimit(input: CreateRepositoryInput, limit: number): Repository {
    const now = new Date();
    const id = crypto.randomUUID();

    const [row] = this.tx
      .select({ value: count() })
      .from(repositoriesTable)
      .all();
    const repositoryCount = row?.value ?? 0;
    if (repositoryCount >= limit) {
      throw new RepositoryLimitExceededError(limit);
    }

    try {
      this.tx
        .insert(repositoriesTable)
        .values({
          id,
          url: input.url,
          owner: input.owner,
          name: input.name,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new RepositoryAlreadyExistsError();
      }
      throw error;
    }

    return Object.freeze({
      id,
      url: input.url,
      owner: input.owner,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });
  }
}

class DrizzleTxSnapshotAdapter implements TransactionSnapshotPort {
  constructor(private readonly tx: DrizzleTransaction) {}

  insert(snapshot: RepositorySnapshot): void {
    const snapshotId = crypto.randomUUID();

    this.tx
      .insert(snapshotsTable)
      .values({
        id: snapshotId,
        repositoryId: snapshot.repositoryId,
        lastCommitAt: snapshot.lastCommitAt,
        lastReleaseAt: snapshot.lastReleaseAt,
        openIssuesCount: snapshot.openIssuesCount,
        contributorsCount: snapshot.contributorsCount,
        status: snapshot.status,
        fetchedAt: snapshot.fetchedAt,
      })
      .run();

    if (snapshot.warningReasons.length > 0) {
      this.tx
        .insert(snapshotWarningReasonsTable)
        .values(
          snapshot.warningReasons.map((reasonKey) => ({
            snapshotId,
            reasonKey,
          })),
        )
        .run();
    }
  }
}

export class DrizzleUnitOfWorkAdapter implements UnitOfWorkPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async runInTransaction<T>(work: (ports: { repositoryPort: TransactionRepositoryPort; snapshotPort: TransactionSnapshotPort }) => T): Promise<T> {
    return this.db.db.transaction((tx) => {
      const ports = {
        repositoryPort: new DrizzleTxRepositoryAdapter(tx),
        snapshotPort: new DrizzleTxSnapshotAdapter(tx),
      } as const;
      return work(ports);
    });
  }
}
