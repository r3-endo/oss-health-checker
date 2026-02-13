import type { RepositoryReadModelPort } from "../../application/ports/repository-read-model-port.js";
import type { RepositoryWithLatestSnapshot } from "../../application/read-models/repository-with-latest-snapshot.js";
import type { Repository } from "../../domain/models/repository.js";
import type { RepositorySnapshot } from "../../domain/models/snapshot.js";
import { asc, inArray, sql } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "../../../../shared/infrastructure/db/drizzle/client.js";
import {
  repositoriesTable,
  snapshotsTable,
  snapshotWarningReasonsTable,
} from "../../../../shared/infrastructure/db/drizzle/schema.js";
import {
  parsePersistedStatus,
  parsePersistedWarningReason,
} from "./persisted-snapshot-validation.js";

type RepositoryRow = typeof repositoriesTable.$inferSelect;
type SnapshotRow = typeof snapshotsTable.$inferSelect;
type SnapshotReasonRow = typeof snapshotWarningReasonsTable.$inferSelect;

const mapRepository = (row: RepositoryRow): Repository =>
  Object.freeze({
    id: row.id,
    url: row.url,
    owner: row.owner,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

const mapSnapshot = (
  snapshot: SnapshotRow,
  reasons: readonly SnapshotReasonRow[],
): RepositorySnapshot =>
  Object.freeze({
    repositoryId: snapshot.repositoryId,
    lastCommitAt: snapshot.lastCommitAt,
    lastReleaseAt: snapshot.lastReleaseAt,
    openIssuesCount: snapshot.openIssuesCount,
    contributorsCount: snapshot.contributorsCount,
    status: parsePersistedStatus(snapshot.status),
    warningReasons: reasons.map((reason) =>
      parsePersistedWarningReason(reason.reasonKey),
    ),
    fetchedAt: snapshot.fetchedAt,
  });

export class DrizzleRepositoryReadModelAdapter implements RepositoryReadModelPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async listWithLatestSnapshot(): Promise<
    readonly RepositoryWithLatestSnapshot[]
  > {
    return this.db.db.transaction((tx) => {
      const repositoryRows = tx
        .select()
        .from(repositoriesTable)
        .orderBy(asc(repositoriesTable.createdAt))
        .all();

      if (repositoryRows.length === 0) {
        return [];
      }

      const snapshotRows = tx
        .select()
        .from(snapshotsTable)
        .where(
          sql`NOT EXISTS (
            SELECT 1
            FROM snapshots AS s2
            WHERE s2.repository_id = ${snapshotsTable.repositoryId}
              AND (
                s2.fetched_at > ${snapshotsTable.fetchedAt}
                OR (
                  s2.fetched_at = ${snapshotsTable.fetchedAt}
                  AND s2.id > ${snapshotsTable.id}
                )
              )
          )`,
        )
        .all();

      const latestSnapshotByRepository = new Map<string, SnapshotRow>();
      for (const snapshot of snapshotRows) {
        if (!latestSnapshotByRepository.has(snapshot.repositoryId)) {
          latestSnapshotByRepository.set(snapshot.repositoryId, snapshot);
        }
      }

      const latestSnapshotIds = [...latestSnapshotByRepository.values()].map(
        (snapshot) => snapshot.id,
      );

      const reasonRows =
        latestSnapshotIds.length > 0
          ? tx
              .select()
              .from(snapshotWarningReasonsTable)
              .where(
                inArray(
                  snapshotWarningReasonsTable.snapshotId,
                  latestSnapshotIds,
                ),
              )
              .all()
          : [];

      const reasonsBySnapshotId = new Map<string, SnapshotReasonRow[]>();
      for (const reasonRow of reasonRows) {
        const currentReasons =
          reasonsBySnapshotId.get(reasonRow.snapshotId) ?? [];
        currentReasons.push(reasonRow);
        reasonsBySnapshotId.set(reasonRow.snapshotId, currentReasons);
      }

      return repositoryRows.map((repositoryRow) => {
        const snapshot = latestSnapshotByRepository.get(repositoryRow.id);
        return Object.freeze({
          repository: mapRepository(repositoryRow),
          snapshot: snapshot
            ? mapSnapshot(snapshot, reasonsBySnapshotId.get(snapshot.id) ?? [])
            : null,
        });
      });
    });
  }
}
