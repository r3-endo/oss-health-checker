export type UpsertRepositoryDailySnapshotInput = Readonly<{
  repositoryId: string;
  recordedAt: string;
  openIssues: number;
  commitCount30d: number | null;
  contributorCount: number | null;
  lastCommitAt: string | null;
  lastReleaseAt: string | null;
  healthScoreVersion: number | null;
}>;

export interface RepositorySnapshotWritePort {
  upsertSnapshot(input: UpsertRepositoryDailySnapshotInput): Promise<void>;
}
