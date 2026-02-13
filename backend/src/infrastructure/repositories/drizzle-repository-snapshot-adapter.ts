import type { DrizzleDatabaseHandle } from "../db/drizzle/client.js";
import { and, count, eq } from "drizzle-orm";
import { repositorySnapshotsTable } from "../db/drizzle/schema.js";

export class DrizzleRepositorySnapshotAdapter {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async upsertSnapshot(params: {
    repositoryId: string;
    recordedAt: string;
    openIssues: number;
    commitCount30d: number | null;
  }): Promise<void> {
    this.db.db
      .insert(repositorySnapshotsTable)
      .values({
        repositoryId: params.repositoryId,
        recordedAt: params.recordedAt,
        openIssues: params.openIssues,
        commitCount30d: params.commitCount30d,
      })
      .onConflictDoUpdate({
        target: [
          repositorySnapshotsTable.repositoryId,
          repositorySnapshotsTable.recordedAt,
        ],
        set: {
          openIssues: params.openIssues,
          commitCount30d: params.commitCount30d,
        },
      })
      .run();
  }

  async countSnapshots(repositoryId: string): Promise<number> {
    const result = this.db.db
      .select({ value: count() })
      .from(repositorySnapshotsTable)
      .where(eq(repositorySnapshotsTable.repositoryId, repositoryId))
      .get();
    return result?.value ?? 0;
  }

  async getSnapshot(
    repositoryId: string,
    recordedAt: string,
  ): Promise<{ openIssues: number; commitCount30d: number | null } | null> {
    const row = this.db.db
      .select({
        openIssues: repositorySnapshotsTable.openIssues,
        commitCount30d: repositorySnapshotsTable.commitCount30d,
      })
      .from(repositorySnapshotsTable)
      .where(
        and(
          eq(repositorySnapshotsTable.repositoryId, repositoryId),
          eq(repositorySnapshotsTable.recordedAt, recordedAt),
        ),
      )
      .limit(1)
      .get();

    if (!row) {
      return null;
    }

    return row;
  }
}
