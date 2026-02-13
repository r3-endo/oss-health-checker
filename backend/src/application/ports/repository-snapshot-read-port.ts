export type RepositoryDailySnapshot = Readonly<{
  repositoryId: string;
  recordedAt: string;
  openIssues: number;
  commitCount30d: number | null;
  contributorCount: number | null;
  lastCommitAt: string | null;
  lastReleaseAt: string | null;
  healthScoreVersion: number | null;
}>;

export interface RepositorySnapshotReadPort {
  findLatestByRepositoryIds(
    repositoryIds: readonly string[],
  ): Promise<ReadonlyMap<string, RepositoryDailySnapshot>>;
  findOpenIssuesAtOrBefore(
    repositoryId: string,
    recordedAt: string,
  ): Promise<number | null>;
}
