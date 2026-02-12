import { z } from "zod";

export const WarningReasonSchema = z.enum([
  "commit_stale",
  "release_stale",
  "open_issues_high",
]);

export const RepositoryStatusSchema = z.enum(["Active", "Stale", "Risky"]);

export const RepositoryViewSchema = z.object({
  id: z.string(),
  url: z.url(),
  owner: z.string(),
  name: z.string(),
  status: RepositoryStatusSchema,
  warningReasons: z.array(WarningReasonSchema),
  lastCommitAt: z.iso.datetime(),
  lastReleaseAt: z.iso.datetime().nullable(),
  openIssuesCount: z.number().int().nonnegative(),
  contributorsCount: z.number().int().nonnegative(),
  fetchedAt: z.iso.datetime(),
});

export const RepositoryApiRepositorySchema = z.object({
  id: z.string(),
  url: z.url(),
  owner: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const RepositoryApiSnapshotSchema = z.object({
  repositoryId: z.string(),
  lastCommitAt: z.iso.datetime(),
  lastReleaseAt: z.iso.datetime().nullable(),
  openIssuesCount: z.number().int().nonnegative(),
  contributorsCount: z.number().int().nonnegative(),
  status: RepositoryStatusSchema,
  warningReasons: z.array(WarningReasonSchema),
  fetchedAt: z.iso.datetime(),
});

export const RepositoryApiListItemSchema = z.object({
  repository: RepositoryApiRepositorySchema,
  snapshot: RepositoryApiSnapshotSchema.nullable(),
});

export const RepositoryListResponseSchema = z.object({
  data: z.array(RepositoryApiListItemSchema),
});

export const RegisterRepositoryResponseSchema = z.object({
  data: z.object({
    repository: RepositoryApiRepositorySchema,
    snapshot: RepositoryApiSnapshotSchema,
  }),
});

export const RefreshRepositoryResponseSchema = z.object({
  data: z.object({
    ok: z.literal(true),
    snapshot: RepositoryApiSnapshotSchema,
  }),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "RATE_LIMIT",
      "EXTERNAL_API_ERROR",
      "GITHUB_RATE_LIMIT",
      "GITHUB_API_ERROR",
      "VALIDATION_ERROR",
      "NOT_FOUND",
      "INTERNAL_ERROR",
    ]),
    message: z.string(),
    detail: z.record(z.string(), z.unknown()).nullable().optional(),
  }),
});

export const RegisterRepositoryInputSchema = z.object({
  url: z.url(),
});

export type WarningReasonKey = z.infer<typeof WarningReasonSchema>;
export type RepositoryStatus = z.infer<typeof RepositoryStatusSchema>;
export type RepositoryView = z.infer<typeof RepositoryViewSchema>;
export type RepositoryApiRepository = z.infer<
  typeof RepositoryApiRepositorySchema
>;
export type RepositoryApiSnapshot = z.infer<typeof RepositoryApiSnapshotSchema>;
export type RepositoryListResponse = z.infer<
  typeof RepositoryListResponseSchema
>;
export type RegisterRepositoryResponse = z.infer<
  typeof RegisterRepositoryResponseSchema
>;
export type RefreshRepositoryResponse = z.infer<
  typeof RefreshRepositoryResponseSchema
>;
export type RegisterRepositoryInput = z.infer<
  typeof RegisterRepositoryInputSchema
>;
export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;
export type RefreshErrorView = ApiErrorResponse["error"];
