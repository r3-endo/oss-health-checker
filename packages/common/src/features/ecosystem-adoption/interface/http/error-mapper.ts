import type { Context } from "hono";
import { ApplicationError } from "../../application/errors/application-error.js";

type HttpStatus = 400 | 404 | 429 | 500 | 502;

const statusByCode: Record<ApplicationError["code"], HttpStatus> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  EXTERNAL_API_ERROR: 502,
  INTERNAL_ERROR: 500,
};

export const mapErrorToHttp = (c: Context, error: unknown): Response => {
  if (error instanceof ApplicationError) {
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          detail: error.detail ?? null,
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
        detail: null,
      },
    },
    500,
  );
};
