import { z } from "@hono/zod-openapi";
import {
  REPOSITORY_STATUSES,
  type RepositoryStatus,
  WARNING_REASON_KEYS,
  type WarningReasonKey,
} from "../../domain/models/status";
import {
  APPLICATION_ERROR_CODES,
  type ApplicationErrorCode,
} from "../../application/errors/application-error";

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
