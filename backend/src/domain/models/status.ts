export const REPOSITORY_STATUSES = ["Active", "Stale", "Risky"] as const;

export type RepositoryStatus = (typeof REPOSITORY_STATUSES)[number];

export const WARNING_REASON_KEYS = [
  "commit_stale",
  "release_stale",
  "open_issues_high",
] as const;

export type WarningReasonKey = (typeof WARNING_REASON_KEYS)[number];
