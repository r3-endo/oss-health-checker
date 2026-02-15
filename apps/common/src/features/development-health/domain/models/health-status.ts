export const HEALTH_STATUSES = ["Active", "Stale", "Risky"] as const;

export type HealthStatus = (typeof HEALTH_STATUSES)[number];

/**
 * Maps a numeric health score to a status label.
 * - Active: score >= 70
 * - Stale: 40 <= score <= 69
 * - Risky: score < 40
 */
export function mapScoreToStatus(score: number): HealthStatus {
  if (score >= 70) {
    return "Active";
  }

  if (score >= 40) {
    return "Stale";
  }

  return "Risky";
}
