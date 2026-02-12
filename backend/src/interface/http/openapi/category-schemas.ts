import { z } from "@hono/zod-openapi";

export const CATEGORY_SLUGS = ["llm", "backend", "frontend"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const HEALTH_STATUSES = ["Active", "Stale", "Risky"] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const CategorySlugSchema = z.enum(CATEGORY_SLUGS);

export const HealthStatusSchema = z.enum(HEALTH_STATUSES);

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
  status: HealthStatusSchema,
  scoreVersion: z.number().int(),
  issueGrowth30d: z.number().nullable(),
  commitLast30d: z.number().int().nullable(),
});

export const MetricsContainerSchema = z.object({
  devHealth: DevHealthMetricsSchema,
  adoption: z.null(),
  security: z.null(),
  governance: z.null(),
});

export const RepositoryViewSchema = z.object({
  owner: z.string(),
  name: z.string(),
  lastCommit: z.iso.datetime().nullable(),
  metrics: MetricsContainerSchema,
});

export const CategoryDetailSchema = z.object({
  slug: z.string(),
  name: z.string(),
  repositories: z.array(RepositoryViewSchema),
});

export const CategoryDetailResponseSchema = z.object({
  data: CategoryDetailSchema,
});

export const CategoryNotFoundErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal("CATEGORY_NOT_FOUND"),
    message: z.string(),
  }),
});

export const CategorySlugParamSchema = z.object({
  slug: z.string().min(1),
});
