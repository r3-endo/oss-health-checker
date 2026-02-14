import type { SnapshotPort } from "../../application/ports/snapshot-port.js";
import type { RepositoryId } from "../../domain/models/repository.js";
import type { RepositorySnapshot } from "../../domain/models/snapshot.js";
import { asc, desc, eq, inArray } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "../../../../shared/infrastructure/db/drizzle/client.js";
import {
  snapshotsTable,
  snapshotWarningReasonsTable,
} from "../../../../shared/infrastructure/db/drizzle/schema.js";
import {
  parsePersistedStatus,
  parsePersistedWarningReason,
} from "./persisted-snapshot-validation.js";

type SnapshotRow = typeof snapshotsTable.$inferSelect;
type SnapshotReasonRow = typeof snapshotWarningReasonsTable.$inferSelect;

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

export class DrizzleSnapshotAdapter implements SnapshotPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async insert(snapshot: RepositorySnapshot): Promise<void> {
    const snapshotId = crypto.randomUUID();

    this.db.db.transaction((tx) => {
      tx.insert(snapshotsTable)
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
        tx.insert(snapshotWarningReasonsTable)
          .values(
            snapshot.warningReasons.map((reasonKey) => ({
              snapshotId,
              reasonKey,
            })),
          )
          .run();
      }
    });
  }

  async findLatestByRepositoryId(
    repositoryId: RepositoryId,
  ): Promise<RepositorySnapshot | null> {
    return this.db.db.transaction((tx) => {
      const [snapshot] = tx
        .select()
        .from(snapshotsTable)
        .where(eq(snapshotsTable.repositoryId, repositoryId))
        .orderBy(desc(snapshotsTable.fetchedAt), desc(snapshotsTable.id))
        .limit(1)
        .all();

      if (!snapshot) {
        return null;
      }

      const reasons = tx
        .select()
        .from(snapshotWarningReasonsTable)
        .where(eq(snapshotWarningReasonsTable.snapshotId, snapshot.id))
        .all();

      return mapSnapshot(snapshot, reasons);
    });
  }

  async findLatestForAllRepositories(): Promise<readonly RepositorySnapshot[]> {
    return this.db.db.transaction((tx) => {
      const snapshotRows = tx
        .select()
        .from(snapshotsTable)
        .orderBy(
          asc(snapshotsTable.repositoryId),
          desc(snapshotsTable.fetchedAt),
          desc(snapshotsTable.id),
        )
        .all();

      const latestByRepository = new Map<string, SnapshotRow>();
      for (const row of snapshotRows) {
        if (!latestByRepository.has(row.repositoryId)) {
          latestByRepository.set(row.repositoryId, row);
        }
      }

      const latestSnapshots = [...latestByRepository.values()];
      if (latestSnapshots.length === 0) {
        return [];
      }

      const reasons = tx
        .select()
        .from(snapshotWarningReasonsTable)
        .where(
          inArray(
            snapshotWarningReasonsTable.snapshotId,
            latestSnapshots.map((snapshot) => snapshot.id),
          ),
        )
        .all();

      const reasonsBySnapshotId = new Map<string, SnapshotReasonRow[]>();
      for (const reason of reasons) {
        const snapshotReasons =
          reasonsBySnapshotId.get(reason.snapshotId) ?? [];
        snapshotReasons.push(reason);
        reasonsBySnapshotId.set(reason.snapshotId, snapshotReasons);
      }

      return latestSnapshots.map((snapshot) =>
        mapSnapshot(snapshot, reasonsBySnapshotId.get(snapshot.id) ?? []),
      );
    });
  }
}
