export type HealthStatus = "Active" | "Stale" | "Risky";

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
