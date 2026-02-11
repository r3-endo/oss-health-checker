import { z } from "@hono/zod-openapi";
import {
  REPOSITORY_STATUSES,
  type RepositoryStatus,
  WARNING_REASON_KEYS,
  type WarningReasonKey,
} from "../../../domain/models/status";
import {
  APPLICATION_ERROR_CODES,
  type ApplicationErrorCode,
} from "../../../application/errors/application-error";

const repositoryStatusValues = [...REPOSITORY_STATUSES] as [
  RepositoryStatus,
  ...RepositoryStatus[],
];
const warningReasonValues = [...WARNING_REASON_KEYS] as [
  WarningReasonKey,
  ...WarningReasonKey[],
];
const applicationErrorCodeValues = [...APPLICATION_ERROR_CODES] as [
  ApplicationErrorCode,
  ...ApplicationErrorCode[],
];

export const WarningReasonSchema = z.enum(warningReasonValues);

export const RepositoryStatusSchema = z.enum(repositoryStatusValues);

export const RepositorySchema = z.object({
  id: z.string(),
  url: z.string().url(),
  owner: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const RepositorySnapshotSchema = z.object({
  repositoryId: z.string(),
  lastCommitAt: z.string().datetime(),
  lastReleaseAt: z.string().datetime().nullable(),
  openIssuesCount: z.number().int().nonnegative(),
  contributorsCount: z.number().int().nonnegative(),
  status: RepositoryStatusSchema,
  warningReasons: z.array(WarningReasonSchema),
  fetchedAt: z.string().datetime(),
});

export const RefreshErrorSchema = z.object({
  code: z.enum(applicationErrorCodeValues),
  message: z.string(),
  detail: z
    .object({
      reason: z.string().optional(),
      limit: z.number().int().optional(),
      status: z.number().int().optional(),
      retryAfterSeconds: z.number().int().nonnegative().nullable().optional(),
      cause: z.string().optional(),
    })
    .optional(),
});

export const RepositoryWithLatestSnapshotSchema = z.object({
  repository: RepositorySchema,
  snapshot: RepositorySnapshotSchema.nullable(),
});

export const RegisterRepositoryRequestSchema = z.object({
  url: z.string().url(),
});

export const RegisterRepositoryResponseSchema = z.object({
  data: z.object({
    repository: RepositorySchema,
    snapshot: RepositorySnapshotSchema,
  }),
});

export const ListRepositoriesResponseSchema = z.object({
  data: z.array(RepositoryWithLatestSnapshotSchema),
});

export const RefreshRepositoryParamsSchema = z.object({
  id: z.string().min(1),
});

export const RefreshRepositoryResponseSchema = z.object({
  data: z.object({
    ok: z.literal(true),
    snapshot: RepositorySnapshotSchema,
  }),
});

const createErrorResponseSchema = (
  code: ApplicationErrorCode,
): z.ZodObject<{
  error: z.ZodObject<{
    code: z.ZodLiteral<ApplicationErrorCode>;
    message: z.ZodString;
    detail: z.ZodNullable<typeof RefreshErrorSchema.shape.detail>;
  }>;
}> =>
  z.object({
    error: z.object({
      code: z.literal(code),
      message: z.string(),
      detail: RefreshErrorSchema.shape.detail.nullable(),
    }),
  });

export const ValidationErrorResponseSchema =
  createErrorResponseSchema("VALIDATION_ERROR");
export const NotFoundErrorResponseSchema =
  createErrorResponseSchema("NOT_FOUND");
export const RateLimitErrorResponseSchema =
  createErrorResponseSchema("RATE_LIMIT");
export const ExternalApiErrorResponseSchema =
  createErrorResponseSchema("EXTERNAL_API_ERROR");
export const InternalErrorResponseSchema =
  createErrorResponseSchema("INTERNAL_ERROR");
