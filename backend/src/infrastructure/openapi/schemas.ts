import { z } from "@hono/zod-openapi";
import {
  REPOSITORY_STATUSES,
  type RepositoryStatus,
  WARNING_REASON_KEYS,
  type WarningReasonKey,
} from "../../domain/models/status";
import {
  REFRESH_ERROR_CODES,
  type RefreshErrorCode,
} from "../../domain/errors/refresh-error";

const repositoryStatusValues = [...REPOSITORY_STATUSES] as [
  RepositoryStatus,
  ...RepositoryStatus[],
];
const warningReasonValues = [...WARNING_REASON_KEYS] as [
  WarningReasonKey,
  ...WarningReasonKey[],
];
const refreshErrorCodeValues = [...REFRESH_ERROR_CODES] as [
  RefreshErrorCode,
  ...RefreshErrorCode[],
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
  code: z.enum(refreshErrorCodeValues),
  message: z.string(),
});
