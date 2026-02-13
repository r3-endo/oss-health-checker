import { z } from "@hono/zod-openapi";
import { CATEGORY_SLUGS } from "../../../domain/models/category.js";

export const CategorySlugSchema = z.enum(CATEGORY_SLUGS);

export const CategorySummarySchema = z.object({
  slug: CategorySlugSchema,
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
});

export const ListCategoriesResponseSchema = z.object({
  data: z.array(CategorySummarySchema),
});

export const RepositoryOwnerSchema = z.object({
  login: z.string().min(1),
  type: z.enum(["Organization", "User"]),
});

export const CategoryRepositoryGitHubSchema = z.object({
  stars: z.number().int().nonnegative().nullable(),
  openIssues: z.number().int().nonnegative().nullable(),
  openPRs: z.number().int().nonnegative().nullable(),
  lastCommitToDefaultBranchAt: z.iso.datetime().nullable(),
  defaultBranch: z.string().min(1).nullable(),
  dataStatus: z.enum(["ok", "pending", "rate_limited", "error"]),
  errorMessage: z.string().nullable(),
});

export const CategoryRepositoryLinksSchema = z.object({
  repo: z.url(),
});

export const RepositoryViewSchema = z.object({
  owner: RepositoryOwnerSchema,
  name: z.string(),
  github: CategoryRepositoryGitHubSchema,
  links: CategoryRepositoryLinksSchema,
});

export const CategoryDetailSchema = z.object({
  slug: CategorySlugSchema,
  name: z.string(),
  updatedAt: z.iso.datetime(),
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
