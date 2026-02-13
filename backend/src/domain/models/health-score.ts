/**
 * Input DTO for health score calculation.
 * All signal fields are nullable — null means "data unavailable".
 */
export type HealthScoreInput = Readonly<{
  lastCommitAt: Date | null;
  lastReleaseAt: Date | null;
  openIssues: number | null;
  contributors: number | null;
  evaluatedAt: Date;
}>;

export type HealthScoreResult = Readonly<{
  score: number;
  scoreVersion: number;
}>;

export const DEDUCTION_REASON_KEYS = [
  "commit_stale_or_missing",
  "release_stale_or_missing",
  "open_issues_high",
  "contributors_low",
] as const;

export type DeductionReasonKey = (typeof DEDUCTION_REASON_KEYS)[number];

export type DeductionReason = Readonly<{
  key: DeductionReasonKey;
  points: 40 | 20 | 15;
}>;

const DAY_MS = 24 * 60 * 60 * 1000;

export const generateDeductionReasons = (
  input: HealthScoreInput,
): readonly DeductionReason[] => {
  const reasons: DeductionReason[] = [];

  const commitAgeMs =
    input.lastCommitAt === null
      ? Number.POSITIVE_INFINITY
      : input.evaluatedAt.getTime() - input.lastCommitAt.getTime();
  if (commitAgeMs > 180 * DAY_MS) {
    reasons.push({ key: "commit_stale_or_missing", points: 40 });
  }

  const releaseAgeMs =
    input.lastReleaseAt === null
      ? Number.POSITIVE_INFINITY
      : input.evaluatedAt.getTime() - input.lastReleaseAt.getTime();
  if (releaseAgeMs > 365 * DAY_MS) {
    reasons.push({ key: "release_stale_or_missing", points: 20 });
  }

  if (input.openIssues !== null && input.openIssues > 100) {
    reasons.push({ key: "open_issues_high", points: 15 });
  }

  if (input.contributors !== null && input.contributors < 3) {
    reasons.push({ key: "contributors_low", points: 15 });
  }

  return Object.freeze(reasons);
};

/**
 * Calculates a numeric health score (0–100) for a repository.
 *
 * Algorithm (scoreVersion=1):
 * 1. Start at 100
 * 2. lastCommitAt == null OR evaluatedAt - lastCommitAt > 180 days → -40
 * 3. lastReleaseAt == null OR evaluatedAt - lastReleaseAt > 365 days → -20
 * 4. openIssues != null && openIssues > 100 → -15
 * 5. contributors != null && contributors < 3 → -15
 * 6. clamp(score, 0, 100)
 */
export function calculateHealthScore(
  input: HealthScoreInput,
  scoreVersion: number,
): HealthScoreResult {
  if (scoreVersion !== 1) {
    throw new Error(`Unsupported scoreVersion: ${scoreVersion}`);
  }

  const deductions = generateDeductionReasons(input);
  const totalDeduction = deductions.reduce(
    (sum, reason) => sum + reason.points,
    0,
  );
  const score = 100 - totalDeduction;

  const clampedScore = Math.max(0, Math.min(100, score));

  return Object.freeze({
    score: clampedScore,
    scoreVersion,
  });
}
