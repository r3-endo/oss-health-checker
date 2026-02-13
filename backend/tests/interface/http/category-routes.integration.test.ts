import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CategoryRepositoryFactsPort } from "../../../src/features/development-health/application/ports/category-repository-facts-port.js";
import { GetCategoryDetailService } from "../../../src/features/development-health/application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "../../../src/features/development-health/application/use-cases/list-category-summaries-use-case.js";
import { buildApp } from "../../../src/shared/bootstrap/build-app.js";
import type { AppEnv } from "../../../src/shared/config/env.js";
import { createDrizzleHandle } from "../../../src/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../../src/shared/infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "../../../src/shared/infrastructure/db/drizzle/seed-category-base.js";
import { DrizzleCategoryReadAdapter } from "../../../src/features/development-health/infrastructure/repositories/drizzle-category-read-adapter.js";
import { CategoryController } from "../../../src/features/development-health/interface/http/controllers/category-controller.js";
import {
  CategoryDetailResponseSchema,
  ListCategoriesResponseSchema,
} from "../../../src/features/development-health/interface/http/openapi/category-schemas.js";

const createTestEnv = (databasePath: string): AppEnv =>
  Object.freeze({
    NODE_ENV: "test",
    GITHUB_API_BASE_URL: "https://api.github.com",
    GITHUB_API_TIMEOUT_MS: 1000,
    GITHUB_TOKEN: undefined,
    DATABASE_URL: `file:${databasePath}`,
    CORS_ALLOWED_ORIGINS: ["http://localhost:5173"],
    NPM_REGISTRY_API_BASE_URL: "https://registry.npmjs.org",
    NPM_DOWNLOADS_API_BASE_URL: "https://api.npmjs.org/downloads",
    NPM_REGISTRY_TIMEOUT_MS: 1000,
    ADOPTION_ENABLED_SOURCES: ["npm"],
  });

describe("category routes integration", () => {
  let tempDir: string;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "oss-health-checker-cat-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    const env = createTestEnv(databasePath);

    const db = createDrizzleHandle(env);
    migrateDrizzleDatabase(db);
    seedCategoryBase(db);

    const categoryReadPort = new DrizzleCategoryReadAdapter(db);
    const listCategorySummariesUseCase = new ListCategorySummariesService(
      categoryReadPort,
    );

    const factsPort: CategoryRepositoryFactsPort = {
      fetchCategoryRepositoryFacts: async (owner) => ({
        owner: {
          login: owner,
          type: owner.includes("-") ? "Organization" : "User",
        },
        stars: 100,
        openIssues: 10,
        openPRs: 3,
        defaultBranch: "main",
        lastCommitToDefaultBranchAt: "2026-02-10T00:00:00.000Z",
        dataStatus: "ok",
        errorMessage: null,
      }),
    };

    const getCategoryDetailUseCase = new GetCategoryDetailService(
      categoryReadPort,
      factsPort,
      () => new Date("2026-02-13T00:00:00.000Z"),
    );

    const categoryController = new CategoryController(
      listCategorySummariesUseCase,
      getCategoryDetailUseCase,
    );

    app = buildApp({
      categoryController,
      repositoryController: {
        listRepositories: async () => ({ data: [] }),
        registerRepository: async () => ({ data: null }),
        refreshRepository: async () => ({ data: null }),
      } as never,
      adoptionController: {
        refresh: async () => ({
          data: {
            adoption: {
              mappingStatus: "not_mapped",
              adoptionFetchStatus: "not_applicable",
              source: null,
              packageName: null,
              weeklyDownloads: null,
              downloadsDelta7d: null,
              downloadsDelta30d: null,
              lastPublishedAt: null,
              latestVersion: null,
              fetchedAt: null,
            },
          },
        }),
      } as never,
      dashboardController: {
        listRepositories: async () => ({ data: [] }),
      } as never,
      corsAllowedOrigins: ["http://localhost:5173"],
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns category summaries", async () => {
    const response = await app.request("/api/categories");

    expect(response.status).toBe(200);
    const json = await response.json();
    const parsed = ListCategoriesResponseSchema.parse(json);
    expect(parsed.data.map((item: { slug: string }) => item.slug)).toEqual([
      "llm",
      "backend",
      "frontend",
    ]);
  });

  it("returns category detail with primary GitHub facts", async () => {
    const response = await app.request("/api/categories/llm");

    expect(response.status).toBe(200);
    const json = await response.json();
    const parsed = CategoryDetailResponseSchema.parse(json);

    expect(parsed.data.updatedAt).toBe("2026-02-13T00:00:00.000Z");
    expect(parsed.data.repositories.length).toBeGreaterThan(1);
    const first = parsed.data.repositories[0];
    expect(first?.owner.login).toBeTruthy();
    expect(first?.github.openIssues).toBe(10);
    expect(first?.github.openPRs).toBe(3);
    expect(first?.github.dataStatus).toBe("ok");
    expect(first?.links.repo).toContain("https://github.com/");
  });

  it("returns CATEGORY_NOT_FOUND for unknown slug", async () => {
    const response = await app.request("/api/categories/unknown");

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("CATEGORY_NOT_FOUND");
  });
});
