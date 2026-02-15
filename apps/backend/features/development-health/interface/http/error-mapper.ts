import type { Context } from "hono";
import { ApplicationError } from "@oss-health-checker/common/features/development-health/application/errors/application-error.js";

type ErrorMappingOptions = Readonly<{
  notFoundCodeOverride?: string;
  includeDetail?: boolean;
}>;

export const mapErrorToHttp = (
  c: Context,
  error: unknown,
  options?: ErrorMappingOptions,
): Response => {
  const includeDetail = options?.includeDetail ?? true;

  if (error instanceof ApplicationError) {
    const statusByCode: Record<
      ApplicationError["code"],
      400 | 404 | 429 | 500 | 502
    > = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      EXTERNAL_API_ERROR: 502,
      RATE_LIMIT: 429,
      INTERNAL_ERROR: 500,
    };

    const errorCode =
      error.code === "NOT_FOUND" && options?.notFoundCodeOverride
        ? options.notFoundCodeOverride
        : error.code;

    return c.json(
      {
        error: {
          code: errorCode,
          message: error.message,
          ...(includeDetail ? { detail: error.detail ?? null } : {}),
        },
      },
      statusByCode[error.code],
    );
  }

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected error",
      },
    },
    500,
  );
};

export const mapCategoryErrorToHttp = (c: Context, error: unknown): Response =>
  mapErrorToHttp(c, error, {
    notFoundCodeOverride: "CATEGORY_NOT_FOUND",
    includeDetail: false,
  });
