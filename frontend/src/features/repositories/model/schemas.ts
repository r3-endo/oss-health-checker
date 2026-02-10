import { z } from "zod";

export const WarningReasonSchema = z.enum([
  "commit_stale",
  "release_stale",
  "open_issues_high",
]);

export const RepositoryStatusSchema = z.enum(["Active", "Stale", "Risky"]);

export const RepositoryViewSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  owner: z.string(),
  name: z.string(),
  status: RepositoryStatusSchema,
  warningReasons: z.array(WarningReasonSchema),
  lastCommitAt: z.string().datetime(),
  lastReleaseAt: z.string().datetime().nullable(),
  openIssuesCount: z.number().int().nonnegative(),
  contributorsCount: z.number().int().nonnegative(),
  fetchedAt: z.string().datetime(),
});

export const RepositoryListResponseSchema = z.object({
  data: z.array(RepositoryViewSchema),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "GITHUB_RATE_LIMIT",
      "GITHUB_API_ERROR",
      "VALIDATION_ERROR",
      "INTERNAL_ERROR",
    ]),
    message: z.string(),
    detail: z.record(z.unknown()).nullable().optional(),
  }),
});

export const RegisterRepositoryInputSchema = z.object({
  url: z.string().url(),
});

export type WarningReasonKey = z.infer<typeof WarningReasonSchema>;
export type RepositoryStatus = z.infer<typeof RepositoryStatusSchema>;
export type RepositoryView = z.infer<typeof RepositoryViewSchema>;
export type RepositoryListResponse = z.infer<
  typeof RepositoryListResponseSchema
>;
export type RegisterRepositoryInput = z.infer<
  typeof RegisterRepositoryInputSchema
>;
export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;
export type RefreshErrorView = ApiErrorResponse["error"];
