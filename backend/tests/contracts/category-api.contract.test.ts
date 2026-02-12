import { describe, expect, it } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createCategoryRoutes } from "../../src/interface/http/routes/category-routes.js";
import {
  CategorySummarySchema,
  CategoryDetailSchema,
  CategoryDetailResponseSchema,
  CategoryNotFoundErrorResponseSchema,
  ListCategoriesResponseSchema,
  RepositoryViewSchema,
  MetricsContainerSchema,
  DevHealthMetricsSchema,
  CategorySlugSchema,
} from "../../src/interface/http/openapi/category-schemas.js";

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
            repositories: [
              {
                owner: "openai",
                name: "gpt-4",
                lastCommit: "2026-02-10T12:00:00Z",
                metrics: {
                  devHealth: {
                    healthScore: 95.5,
                    status: "Active" as const,
                    scoreVersion: 1,
                    issueGrowth30d: 10,
                    commitLast30d: 50,
                  },
                  adoption: null,
                  security: null,
                  governance: null,
                },
              },
              {
                owner: "meta",
                name: "llama",
                lastCommit: null,
                metrics: {
                  devHealth: {
                    healthScore: 80.0,
                    status: "Stale" as const,
                    scoreVersion: 1,
                    issueGrowth30d: null,
                    commitLast30d: null,
                  },
                  adoption: null,
                  security: null,
                  governance: null,
                },
              },
              {
                owner: "anthropic",
                name: "claude",
                lastCommit: "2026-02-12T08:30:00Z",
                metrics: {
                  devHealth: {
                    healthScore: 70.2,
                    status: "Risky" as const,
                    scoreVersion: 1,
                    issueGrowth30d: 100,
                    commitLast30d: 5,
                  },
                  adoption: null,
                  security: null,
                  governance: null,
                },
              },
            ],
          },
        };
      }

      throw new Error("Category not found");
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
        expect(typeof validCategory.name).toBe("string");
        expect(typeof validCategory.displayOrder).toBe("number");
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

    it("CategoryDetail contains slug, name, repositories array", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const detail = CategoryDetailSchema.parse(parsed.data);
      expect(detail.slug).toBeDefined();
      expect(detail.name).toBeDefined();
      expect(Array.isArray(detail.repositories)).toBe(true);
    });

    it("each RepositoryView has owner, name, lastCommit (nullable), metrics structure", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      for (const repo of parsed.data.repositories) {
        const validRepo = RepositoryViewSchema.parse(repo);
        expect(validRepo.owner).toBeDefined();
        expect(validRepo.name).toBeDefined();
        expect("lastCommit" in validRepo).toBe(true);
        expect(validRepo.metrics).toBeDefined();
      }
    });

    it("metrics.devHealth has healthScore, status, scoreVersion, issueGrowth30d (nullable), commitLast30d (nullable)", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      for (const repo of parsed.data.repositories) {
        const validMetrics = MetricsContainerSchema.parse(repo.metrics);
        const devHealth = DevHealthMetricsSchema.parse(validMetrics.devHealth);

        expect(devHealth.healthScore).toBeDefined();
        expect(typeof devHealth.healthScore).toBe("number");
        expect(devHealth.status).toBeDefined();
        expect(["Active", "Stale", "Risky"]).toContain(devHealth.status);
        expect(devHealth.scoreVersion).toBeDefined();
        expect(typeof devHealth.scoreVersion).toBe("number");
        expect("issueGrowth30d" in devHealth).toBe(true);
        expect("commitLast30d" in devHealth).toBe(true);
      }
    });

    it("metrics.adoption, security, governance are null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      for (const repo of parsed.data.repositories) {
        const validMetrics = MetricsContainerSchema.parse(repo.metrics);
        expect(validMetrics.adoption).toBe(null);
        expect(validMetrics.security).toBe(null);
        expect(validMetrics.governance).toBe(null);
      }
    });

    it("repositories are sorted by healthScore descending", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const healthScores = parsed.data.repositories.map(
        (repo) => repo.metrics.devHealth.healthScore,
      );

      for (let i = 0; i < healthScores.length - 1; i++) {
        expect(healthScores[i]!).toBeGreaterThanOrEqual(healthScores[i + 1]!);
      }
    });
  });

  describe("nullable contract", () => {
    it("lastCommit can be null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const reposWithNullLastCommit = parsed.data.repositories.filter(
        (repo) => repo.lastCommit === null,
      );

      expect(reposWithNullLastCommit.length).toBeGreaterThan(0);
    });

    it("issueGrowth30d can be null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const reposWithNullIssueGrowth = parsed.data.repositories.filter(
        (repo) => repo.metrics.devHealth.issueGrowth30d === null,
      );

      expect(reposWithNullIssueGrowth.length).toBeGreaterThan(0);
    });

    it("commitLast30d can be null", async () => {
      const app = createContractApp();
      const response = await app.request("/api/categories/llm", {
        method: "GET",
      });

      const json = await response.json();
      const parsed = CategoryDetailResponseSchema.parse(json);

      const reposWithNullCommitLast30d = parsed.data.repositories.filter(
        (repo) => repo.metrics.devHealth.commitLast30d === null,
      );

      expect(reposWithNullCommitLast30d.length).toBeGreaterThan(0);
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
