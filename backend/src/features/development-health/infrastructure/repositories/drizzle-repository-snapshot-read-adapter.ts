import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import type {
  RepositoryDailySnapshot,
  RepositorySnapshotReadPort,
} from "../../application/ports/repository-snapshot-read-port.js";
import type { DrizzleDatabaseHandle } from "../../../../shared/infrastructure/db/drizzle/client.js";
import { repositorySnapshotsTable } from "../../../../shared/infrastructure/db/drizzle/schema.js";

const mapSnapshot = (
  row: typeof repositorySnapshotsTable.$inferSelect,
): RepositoryDailySnapshot =>
  Object.freeze({
    repositoryId: row.repositoryId,
    recordedAt: row.recordedAt,
    openIssues: row.openIssues,
    commitCount30d: row.commitCount30d,
    contributorCount: row.contributorCount,
    lastCommitAt: row.lastCommitAt,
    lastReleaseAt: row.lastReleaseAt,
    healthScoreVersion: row.healthScoreVersion,
  });

export class DrizzleRepositorySnapshotReadAdapter implements RepositorySnapshotReadPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async findLatestByRepositoryIds(
    repositoryIds: readonly string[],
  ): Promise<ReadonlyMap<string, RepositoryDailySnapshot>> {
    if (repositoryIds.length === 0) {
      return new Map();
    }

    const rows = await this.db.db
      .select()
      .from(repositorySnapshotsTable)
      .where(
        and(
          inArray(repositorySnapshotsTable.repositoryId, [...repositoryIds]),
          sql`NOT EXISTS (
            SELECT 1
            FROM repository_snapshots AS rs2
            WHERE rs2.repository_id = ${repositorySnapshotsTable.repositoryId}
              AND rs2.recorded_at > ${repositorySnapshotsTable.recordedAt}
          )`,
        ),
      );

    return new Map(
      rows.map((row) => {
        const snapshot = mapSnapshot(row);
        return [snapshot.repositoryId, snapshot] as const;
      }),
    );
  }

  async findOpenIssuesAtOrBefore(
    repositoryId: string,
    recordedAt: string,
  ): Promise<number | null> {
    const row = await this.db.db
      .select({ openIssues: repositorySnapshotsTable.openIssues })
      .from(repositorySnapshotsTable)
      .where(
        and(
          eq(repositorySnapshotsTable.repositoryId, repositoryId),
          lte(repositorySnapshotsTable.recordedAt, recordedAt),
        ),
      )
      .orderBy(desc(repositorySnapshotsTable.recordedAt))
      .limit(1)
      .get();

    return row?.openIssues ?? null;
  }
}
