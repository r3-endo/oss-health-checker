export const APPLICATION_ERROR_CODES = [
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "EXTERNAL_API_ERROR",
  "RATE_LIMIT",
  "INTERNAL_ERROR",
] as const;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[number];

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
    public readonly detail?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
