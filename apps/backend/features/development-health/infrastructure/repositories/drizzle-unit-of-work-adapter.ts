import {
  RepositoryLimitExceededError,
  type CreateRepositoryInput,
} from "@oss-health-checker/common/features/development-health/application/ports/repository-port.js";
import type {
  TransactionRepositoryPort,
  TransactionSnapshotPort,
  UnitOfWorkPort,
} from "../../application/ports/unit-of-work-port.js";
import type { Repository } from "@oss-health-checker/common/features/development-health/domain/models/repository.js";
import type { RepositorySnapshot } from "@oss-health-checker/common/features/development-health/domain/models/snapshot.js";
import { count, eq, notExists } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import {
  repositoriesTable,
  repositoryCategoriesTable,
  snapshotsTable,
  snapshotWarningReasonsTable,
} from "@oss-health-checker/common/shared/infrastructure/db/drizzle/schema.js";

type DrizzleTransaction = Parameters<
  Parameters<DrizzleDatabaseHandle["db"]["transaction"]>[0]
>[0];

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Error &&
  /UNIQUE constraint failed: repositories\.url/.test(error.message);

class DrizzleTxRepositoryAdapter implements TransactionRepositoryPort {
  constructor(private readonly tx: DrizzleTransaction) {}

  findByUrl(url: string): Repository | null {
    const row = this.tx
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.url, url))
      .limit(1)
      .get();
    if (!row) {
      return null;
    }
    return Object.freeze({
      id: row.id,
      url: row.url,
      owner: row.owner,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  createWithLimit(input: CreateRepositoryInput, limit: number): Repository {
    const now = new Date();
    const id = crypto.randomUUID();

    const [row] = this.tx
      .select({ value: count() })
      .from(repositoriesTable)
      .where(
        notExists(
          this.tx
            .select({ repositoryId: repositoryCategoriesTable.repositoryId })
            .from(repositoryCategoriesTable)
            .where(
              eq(repositoryCategoriesTable.repositoryId, repositoriesTable.id),
            ),
        ),
      )
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
        const existing = this.findByUrl(input.url);
        if (existing) {
          return existing;
        }
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

  async runInTransaction<T>(
    work: (ports: {
      repositoryPort: TransactionRepositoryPort;
      snapshotPort: TransactionSnapshotPort;
    }) => T,
  ): Promise<T> {
    return this.db.db.transaction((tx) => {
      const ports = {
        repositoryPort: new DrizzleTxRepositoryAdapter(tx),
        snapshotPort: new DrizzleTxSnapshotAdapter(tx),
      } as const;
      const result = work(ports);
      if (
        result != null &&
        typeof (result as Record<string, unknown>).then === "function"
      ) {
        throw new Error(
          "runInTransaction callback must be synchronous. " +
            "Async callbacks would escape the transaction boundary.",
        );
      }
      return result;
    });
  }
}
