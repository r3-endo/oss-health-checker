import type { RepositorySignals } from "../ports/repository-gateway-port";
import type { RepositorySnapshot } from "../../domain/models/snapshot";

export const buildSnapshotFromSignals = (
  repositoryId: string,
  signals: RepositorySignals,
  fetchedAt: Date,
): RepositorySnapshot =>
  Object.freeze({
    repositoryId,
    lastCommitAt: signals.lastCommitAt,
    lastReleaseAt: signals.lastReleaseAt,
    openIssuesCount: signals.openIssuesCount,
    contributorsCount: signals.contributorsCount,
    status: "Active",
    warningReasons: [],
    fetchedAt,
  });
