import { z } from "zod";

export const WarningReasonSchema = z.enum([
  "commit_stale",
  "release_stale",
  "open_issues_high",
]);

export const RepositoryStatusSchema = z.enum(["Active", "Stale", "Risky"]);
export const CategorySlugSchema = z.enum(["llm", "backend", "frontend"]);

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
      "CATEGORY_NOT_FOUND",
    ]),
    message: z.string(),
    detail: z.record(z.string(), z.unknown()).nullable().optional(),
  }),
});

export const RegisterRepositoryInputSchema = z.object({
  url: z.url(),
});

export const CategorySummarySchema = z.object({
  slug: CategorySlugSchema,
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
});

export const ListCategoriesResponseSchema = z.object({
  data: z.array(CategorySummarySchema),
});

export const DevHealthMetricsSchema = z.object({
  healthScore: z.number(),
  status: RepositoryStatusSchema,
  scoreVersion: z.number().int(),
  issueGrowth30d: z.number().nullable(),
  commitLast30d: z.number().int().nullable(),
});

export const CategoryRepositoryMetricsSchema = z.object({
  devHealth: DevHealthMetricsSchema,
  adoption: z.null(),
  security: z.null(),
  governance: z.null(),
});

export const CategoryRepositoryViewSchema = z.object({
  owner: z.string(),
  name: z.string(),
  lastCommit: z.iso.datetime().nullable(),
  metrics: CategoryRepositoryMetricsSchema,
});

export const CategoryDetailSchema = z.object({
  slug: CategorySlugSchema,
  name: z.string(),
  repositories: z.array(CategoryRepositoryViewSchema),
});

export const CategoryDetailResponseSchema = z.object({
  data: CategoryDetailSchema,
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
export type CategorySlug = z.infer<typeof CategorySlugSchema>;
export type CategorySummary = z.infer<typeof CategorySummarySchema>;
export type ListCategoriesResponse = z.infer<
  typeof ListCategoriesResponseSchema
>;
export type CategoryRepositoryView = z.infer<
  typeof CategoryRepositoryViewSchema
>;
export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;
export type CategoryDetailResponse = z.infer<
  typeof CategoryDetailResponseSchema
>;
