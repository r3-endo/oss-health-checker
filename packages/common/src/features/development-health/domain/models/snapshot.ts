import type { RepositoryStatus, WarningReasonKey } from "./status.js";

export type RepositorySnapshot = Readonly<{
  repositoryId: string;
  lastCommitAt: Date;
  lastReleaseAt: Date | null;
  openIssuesCount: number;
  contributorsCount: number;
  status: RepositoryStatus;
  warningReasons: readonly WarningReasonKey[];
  fetchedAt: Date;
}>;
