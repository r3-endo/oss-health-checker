import { describe, expect, it } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { ApplicationError } from "../../src/features/development-health/application/errors/application-error.js";
import { createCategoryRoutes } from "../../src/features/development-health/interface/http/routes/category-routes.js";
import {
  CategorySummarySchema,
  CategoryDetailSchema,
  CategoryDetailResponseSchema,
  CategoryNotFoundErrorResponseSchema,
  ListCategoriesResponseSchema,
  RepositoryViewSchema,
  CategoryRepositoryGitHubSchema,
  CategorySlugSchema,
} from "../../src/features/development-health/interface/http/openapi/category-schemas.js";

const createContractApp = (): OpenAPIHono => {
  const app = new OpenAPIHono();

  const controller = {
    listCategories: async () => ({
      data: [
        {
          slug: "llm" as const,
          name: "Large Language Models",
          displayOrder: 1,
        },
        {
          slug: "backend" as const,
          name: "Backend Frameworks",
          displayOrder: 2,
        },
        {
          slug: "frontend" as const,
          name: "Frontend Frameworks",
          displayOrder: 3,
        },
      ],
    }),
    getCategoryDetail: async (params: { slug: string }) => {
      if (params.slug === "llm") {
        return {
          data: {
            slug: "llm",
            name: "Large Language Models",
            updatedAt: "2026-02-13T00:00:00Z",
            repositories: [
              {
                owner: {
                  login: "anthropic",
                  type: "Organization" as const,
                },
                name: "claude",
                github: {
                  stars: 702,
                  openIssues: 100,
                  openPRs: 5,
                  lastCommitToDefaultBranchAt: "2026-02-12T08:30:00Z",
                  defaultBranch: "main",
                  dataStatus: "ok" as const,
                  errorMessage: null,
                },
                links: {
                  repo: "https://github.com/anthropic/claude",
                },
              },
              {
                owner: {
                  login: "meta",
                  type: "Organization" as const,
                },
                name: "llama",
                github: {
                  stars: null,
                  openIssues: null,
                  openPRs: null,
                  lastCommitToDefaultBranchAt: null,
                  defaultBranch: null,
                  dataStatus: "rate_limited" as const,
                  errorMessage: "GitHub API rate limit exceeded",
                },
                links: {
                  repo: "https://github.com/meta/llama",
                },
              },
              {
                owner: {
                  login: "openai",
                  type: "Organization" as const,
                },
                name: "gpt-4",
                github: {
                  stars: 955,
                  openIssues: 10,
                  openPRs: 50,
                  lastCommitToDefaultBranchAt: "2026-02-10T12:00:00Z",
                  defaultBranch: "main",
                  dataStatus: "ok" as const,
                  errorMessage: null,
                },
                links: {
                  repo: "https://github.com/openai/gpt-4",
                },
              },
            ],
          },
        };
      }

      throw new ApplicationError("NOT_FOUND", "Category not found");
    },
  };

  app.route("/api", createCategoryRoutes(controller as never));
  app.doc("/api/openapi.json", {
    openapi: "3.0.0",
    info: { title: "contract-test", version: "1.0.0" },
  });

  return app;
};

const normalizePathParams = (path: string): string =>
  path.replace(/:([^/]+)/g, "{$1}");

describe("category api contract", () => {
  describe("GET /api/categories response contract", () => {
    it("returns 200 with array of CategorySummary objects", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories", { method: "GET" });

      expect(response.status).toBe(200);

      const json = await response.json();
      const parsed = ListCategoriesResponseSchema.parse(json);

      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.data.length).toBeGreaterThan(0);
    });

    it("each CategorySummary has slug, name, displayOrder fields", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories", { method: "GET" });

      const json = await response.json();
      const parsed = ListCategoriesResponseSchema.parse(json);

      for (const category of parsed.data) {
        const validCategory = CategorySummarySchema.parse(category);
        expect(validCategory.slug).toBeDefined();
        expect(validCategory.name).toBeDefined();
        expect(validCategory.displayOrder).toBeDefined();
      }
    });

    it("slug values are from the expected enum", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories", { method: "GET" });

      const json = await response.json();
      const parsed = ListCategoriesResponseSchema.parse(json);

      const allowedSlugs = ["llm", "backend", "frontend"];
      for (const category of parsed.data) {
        CategorySlugSchema.parse(category.slug);
        expect(allowedSlugs).toContain(category.slug);
      }
    });
  });

  describe("GET /api/categories/:slug response contract", () => {
    it("returns 200 with CategoryDetail", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      expect(response.status).toBe(200);

      const json = await response.json();
      CategoryDetailResponseSchema.parse(json);
    });

    it("CategoryDetail contains slug, name, updatedAt, repositories array", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const detail = CategoryDetailSchema.parse(parsed.data);
      expect(detail.slug).toBeDefined();
      expect(detail.name).toBeDefined();
      expect(detail.updatedAt).toBeDefined();
      expect(Array.isArray(detail.repositories)).toBe(true);
    });

    it("each RepositoryView has owner, name, github, links structure", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      for (const repo of parsed.data.repositories) {
        const validRepo = RepositoryViewSchema.parse(repo);
        expect(validRepo.owner.login).toBeDefined();
        expect(validRepo.owner.type).toBeDefined();
        expect(validRepo.name).toBeDefined();
        expect(validRepo.github).toBeDefined();
        expect(validRepo.links.repo).toContain("https://github.com/");
      }
    });

    it("github object has stars/issues/prs/default-branch/last-commit/data-status", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      for (const repo of parsed.data.repositories) {
        const github = CategoryRepositoryGitHubSchema.parse(repo.github);
        expect("openIssues" in github).toBe(true);
        expect("openPRs" in github).toBe(true);
        expect(["ok", "pending", "rate_limited", "error"]).toContain(
          github.dataStatus,
        );
      }
    });

    it("repositories are sorted by owner/name ascending", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const keys = parsed.data.repositories.map(
        (repo) => `${repo.owner.login}/${repo.name}`,
      );
      expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe("nullable contract", () => {
    it("openIssues can be null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const reposWithNullOpenIssues = parsed.data.repositories.filter(
        (repo) => repo.github.openIssues === null,
      );

      expect(reposWithNullOpenIssues.length).toBeGreaterThan(0);
    });

    it("openPRs can be null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const reposWithNullOpenPRs = parsed.data.repositories.filter(
        (repo) => repo.github.openPRs === null,
      );

      expect(reposWithNullOpenPRs.length).toBeGreaterThan(0);
    });

    it("lastCommitToDefaultBranchAt can be null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const reposWithNullLastCommit = parsed.data.repositories.filter(
        (repo) => repo.github.lastCommitToDefaultBranchAt === null,
      );

      expect(reposWithNullLastCommit.length).toBeGreaterThan(0);
    });
  });

  describe("CATEGORY_NOT_FOUND", () => {
    it("GET /api/categories/nonexistent returns 404", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/nonexistent", {
        method: "GET",
      });

      expect(response.status).toBe(404);
    });

    it("404 response body has { error: { code: CATEGORY_NOT_FOUND, message: string } }", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/nonexistent", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryNotFoundErrorResponseSchema.parse(json);

      expect(parsed.error.code).toBe("CATEGORY_NOT_FOUND");
      expect(typeof parsed.error.message).toBe("string");
      expect(parsed.error.message.length).toBeGreaterThan(0);
    });
  });

  describe("OpenAPI binding", () => {
    it("category routes are registered in OpenAPI spec", async () => {
      const app = createContractApp();

      const openApiResponse = await app.request("/api/openapi.json");
      expect(openApiResponse.status).toBe(200);

      const openApiDocument = (await openApiResponse.json()) as {
        paths: Record<string, unknown>;
      };

      const openApiPaths = Object.keys(openApiDocument.paths);
      expect(openApiPaths).toContain("/api/categories");
      expect(openApiPaths).toContain("/api/categories/{slug}");
    });

    it("OpenAPI paths include /api/categories and /api/categories/{slug}", async () => {
      const app = createContractApp();

      const runtimePaths = new Set(
        app.routes
          .filter((route) => route.path.startsWith("/api/categories"))
          .filter((route) => route.method !== "OPTIONS")
          .map((route) => normalizePathParams(route.path)),
      );

      expect(runtimePaths.has("/api/categories")).toBe(true);
      expect(runtimePaths.has("/api/categories/{slug}")).toBe(true);
    });
  });
});
