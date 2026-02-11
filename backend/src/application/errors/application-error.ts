export const APPLICATION_ERROR_CODES = [
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "EXTERNAL_API_ERROR",
  "RATE_LIMIT",
  "INTERNAL_ERROR",
] as const;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[number];

type ValidationErrorDetail = Readonly<{
  reason?: string;
  limit?: number;
}>;

type NotFoundErrorDetail = undefined;

type ExternalApiErrorDetail = Readonly<{
  status?: number;
}>;

type RateLimitErrorDetail = Readonly<{
  status?: number;
  retryAfterSeconds?: number | null;
}>;

type InternalErrorDetail = Readonly<{
  cause?: string;
}>;

export type ApplicationErrorDetailMap = {
  VALIDATION_ERROR: ValidationErrorDetail;
  NOT_FOUND: NotFoundErrorDetail;
  EXTERNAL_API_ERROR: ExternalApiErrorDetail;
  RATE_LIMIT: RateLimitErrorDetail;
  INTERNAL_ERROR: InternalErrorDetail;
};

export type ApplicationErrorDetail =
  ApplicationErrorDetailMap[ApplicationErrorCode];

export class ApplicationError extends Error {
  public readonly code: ApplicationErrorCode;
  public readonly detail?: ApplicationErrorDetail;

  constructor(
    code: "VALIDATION_ERROR",
    message: string,
    detail?: ValidationErrorDetail,
  );
  constructor(code: "NOT_FOUND", message: string, detail?: NotFoundErrorDetail);
  constructor(
    code: "EXTERNAL_API_ERROR",
    message: string,
    detail?: ExternalApiErrorDetail,
  );
  constructor(
    code: "RATE_LIMIT",
    message: string,
    detail?: RateLimitErrorDetail,
  );
  constructor(
    code: "INTERNAL_ERROR",
    message: string,
    detail?: InternalErrorDetail,
  );
  constructor(
    code: ApplicationErrorCode,
    message: string,
    detail?: ApplicationErrorDetail,
  ) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.detail = detail;
  }
}
