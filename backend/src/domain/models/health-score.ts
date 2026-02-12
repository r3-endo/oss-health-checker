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

  const DAY_MS = 24 * 60 * 60 * 1000;
  let score = 100;

  const commitAgeMs =
    input.lastCommitAt === null
      ? Number.POSITIVE_INFINITY
      : input.evaluatedAt.getTime() - input.lastCommitAt.getTime();
  if (commitAgeMs > 180 * DAY_MS) {
    score -= 40;
  }

  const releaseAgeMs =
    input.lastReleaseAt === null
      ? Number.POSITIVE_INFINITY
      : input.evaluatedAt.getTime() - input.lastReleaseAt.getTime();
  if (releaseAgeMs > 365 * DAY_MS) {
    score -= 20;
  }

  if (input.openIssues !== null && input.openIssues > 100) {
    score -= 15;
  }

  if (input.contributors !== null && input.contributors < 3) {
    score -= 15;
  }

  const clampedScore = Math.max(0, Math.min(100, score));

  return Object.freeze({
    score: clampedScore,
    scoreVersion,
  });
}
