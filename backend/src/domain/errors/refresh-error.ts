export const REFRESH_ERROR_CODES = [
  "GITHUB_RATE_LIMIT",
  "GITHUB_API_ERROR",
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
] as const;

export type RefreshErrorCode = (typeof REFRESH_ERROR_CODES)[number];

export type RefreshError = Readonly<{
  code: RefreshErrorCode;
  message: string;
}>;
