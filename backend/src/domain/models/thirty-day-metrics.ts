export type SnapshotRecord = Readonly<{
  repositoryId: string;
  recordedAt: Date; // UTC normalized YYYY-MM-DDT00:00:00Z
  openIssues: number;
  commitCount30d: number | null;
}>;

/**
 * Calculates issue growth over 30 days.
 * Returns null if no snapshot exists at or before (recordedAt - 30 days).
 *
 * issueGrowth30d = current.openIssues - baseline.openIssues
 */
export function calculateIssueGrowth30d(
  current: SnapshotRecord,
  history: readonly SnapshotRecord[],
): number | null {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const baselineThreshold = current.recordedAt.getTime() - THIRTY_DAYS_MS;

  let baseline: SnapshotRecord | null = null;
  for (const snapshot of history) {
    if (snapshot.repositoryId !== current.repositoryId) {
      continue;
    }

    if (snapshot.recordedAt.getTime() <= baselineThreshold) {
      if (
        baseline === null ||
        snapshot.recordedAt.getTime() > baseline.recordedAt.getTime()
      ) {
        baseline = snapshot;
      }
    }
  }

  if (baseline === null) {
    return null;
  }

  return current.openIssues - baseline.openIssues;
}

/**
 * Returns commitCount30d from the current snapshot, or null if unavailable.
 */
export function resolveCommitLast30d(current: SnapshotRecord): number | null {
  return current.commitCount30d;
}
