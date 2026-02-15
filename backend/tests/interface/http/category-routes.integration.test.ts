import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { RegistryDataPort } from "@oss-health-checker/common/features/development-health/application/ports/registry-data-port.js";
import { GetCategoryDetailService } from "@oss-health-checker/common/features/development-health/application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "@oss-health-checker/common/features/development-health/application/use-cases/list-category-summaries-use-case.js";
import { buildApp } from "../../../../apps/backend/src/build-app.js";
import type { AppEnv } from "@oss-health-checker/common/shared/config/env.js";
import { createDrizzleHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/seed-category-base.js";
import { DrizzleCategoryReadAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-category-read-adapter.js";
import { DrizzleRepositorySnapshotReadAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-snapshot-read-adapter.js";
import { CategoryController } from "../../../../apps/backend/features/development-health/interface/http/controllers/category-controller.js";
import {
  CategoryDetailResponseSchema,
  ListCategoriesResponseSchema,
} from "../../../../apps/backend/features/development-health/interface/http/openapi/category-schemas.js";

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

    const registryDataPort: RegistryDataPort = {
      findLatestByRepositoryId: async () => null,
    };
    const snapshotReadPort = new DrizzleRepositorySnapshotReadAdapter(db);

    const getCategoryDetailUseCase = new GetCategoryDetailService(
      categoryReadPort,
      snapshotReadPort,
      registryDataPort,
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

  it("returns category detail from persisted snapshot data", async () => {
    const response = await app.request("/api/categories/llm");

    expect(response.status).toBe(200);
    const json = await response.json();
    const parsed = CategoryDetailResponseSchema.parse(json);

    expect(Number.isNaN(new Date(parsed.data.updatedAt).getTime())).toBe(false);
    expect(parsed.data.repositories.length).toBeGreaterThan(1);
    const first = parsed.data.repositories[0];
    expect(first?.owner.login).toBeTruthy();
    expect(["ok", "pending"].includes(first?.github.dataStatus ?? "")).toBe(
      true,
    );
    expect(first?.links.repo).toContain("https://github.com/");
  });

  it("returns CATEGORY_NOT_FOUND for unknown slug", async () => {
    const response = await app.request("/api/categories/unknown");

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("CATEGORY_NOT_FOUND");
  });
});
