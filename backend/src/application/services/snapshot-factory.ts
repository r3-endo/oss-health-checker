import type { RepositorySignals } from "../ports/repository-gateway-port";
import type { RepositorySnapshot } from "../../domain/models/snapshot";
import type {
  RepositoryStatus,
  WarningReasonKey,
} from "../../domain/models/status";

const COMMIT_STALE_MONTHS = 6;
const RELEASE_STALE_MONTHS = 12;
const OPEN_ISSUES_HIGH_THRESHOLD = 100;

const getDaysInUtcMonth = (year: number, monthZeroBased: number): number =>
  new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();

const addMonthsUtc = (date: Date, months: number): Date => {
  const sourceYear = date.getUTCFullYear();
  const sourceMonth = date.getUTCMonth();
  const sourceDay = date.getUTCDate();
  const sourceHours = date.getUTCHours();
  const sourceMinutes = date.getUTCMinutes();
  const sourceSeconds = date.getUTCSeconds();
  const sourceMilliseconds = date.getUTCMilliseconds();

  const absoluteMonth = sourceMonth + months;
  const targetYear = sourceYear + Math.floor(absoluteMonth / 12);
  const targetMonth = ((absoluteMonth % 12) + 12) % 12;
  const targetDay = Math.min(
    sourceDay,
    getDaysInUtcMonth(targetYear, targetMonth),
  );

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      sourceHours,
      sourceMinutes,
      sourceSeconds,
      sourceMilliseconds,
    ),
  );
};

const isAtLeastMonthsOld = (
  observedAt: Date,
  evaluatedAt: Date,
  months: number,
): boolean => addMonthsUtc(observedAt, months).getTime() <= evaluatedAt.getTime();

export const evaluateWarningReasons = (
  signals: RepositorySignals,
  evaluatedAt: Date,
): readonly WarningReasonKey[] => {
  const warnings: WarningReasonKey[] = [];

  if (isAtLeastMonthsOld(signals.lastCommitAt, evaluatedAt, COMMIT_STALE_MONTHS)) {
    warnings.push("commit_stale");
  }

  if (
    signals.lastReleaseAt !== null &&
    isAtLeastMonthsOld(signals.lastReleaseAt, evaluatedAt, RELEASE_STALE_MONTHS)
  ) {
    warnings.push("release_stale");
  }

  if (signals.openIssuesCount > OPEN_ISSUES_HIGH_THRESHOLD) {
    warnings.push("open_issues_high");
  }

  return Object.freeze(warnings);
};

export const mapStatusFromWarningCount = (
  warningCount: number,
): RepositoryStatus => {
  if (warningCount === 0) {
    return "Active";
  }
  if (warningCount === 1) {
    return "Stale";
  }
  return "Risky";
};

export const buildSnapshotFromSignals = (
  repositoryId: string,
  signals: RepositorySignals,
  fetchedAt: Date,
): RepositorySnapshot => {
  const warningReasons = evaluateWarningReasons(signals, fetchedAt);
  return Object.freeze({
    repositoryId,
    lastCommitAt: new Date(signals.lastCommitAt.getTime()),
    lastReleaseAt:
      signals.lastReleaseAt === null
        ? null
        : new Date(signals.lastReleaseAt.getTime()),
    openIssuesCount: signals.openIssuesCount,
    contributorsCount: signals.contributorsCount,
    status: mapStatusFromWarningCount(warningReasons.length),
    warningReasons,
    fetchedAt: new Date(fetchedAt.getTime()),
  });
};
