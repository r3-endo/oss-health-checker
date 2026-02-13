import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildApp, buildContainer } from "../../../src/app.js";
import type { AppEnv } from "../../../src/infrastructure/config/env.js";
import { createDrizzleHandle } from "../../../src/infrastructure/db/drizzle/client.js";
import { repositorySnapshotsTable } from "../../../src/infrastructure/db/drizzle/schema.js";
import {
  CategoryDetailResponseSchema,
  ListCategoriesResponseSchema,
} from "../../../src/interface/http/openapi/category-schemas.js";

const createTestEnv = (databasePath: string): AppEnv =>
  Object.freeze({
    NODE_ENV: "test",
    GITHUB_API_BASE_URL: "https://api.github.com",
    GITHUB_API_TIMEOUT_MS: 1000,
    GITHUB_TOKEN: undefined,
    DATABASE_URL: `file:${databasePath}`,
    CORS_ALLOWED_ORIGINS: ["http://localhost:5173"],
  });

describe("category routes integration", () => {
  let tempDir: string;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "oss-health-checker-cat-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    const env = createTestEnv(databasePath);
    const container = buildContainer(env);
    app = buildApp(container);

    const db = createDrizzleHandle(env);
    const latestRecordedAt = "2026-02-10T00:00:00.000Z";

    db.db
      .insert(repositorySnapshotsTable)
      .values([
        {
          repositoryId: "seed-openai-openai-agent-sdk",
          recordedAt: latestRecordedAt,
          openIssues: 30,
          commitCount30d: 50,
          contributorCount: 12,
          lastCommitAt: "2026-02-08T00:00:00.000Z",
          lastReleaseAt: "2026-01-20T00:00:00.000Z",
          healthScoreVersion: 1,
        },
        {
          repositoryId: "seed-openai-openai-agent-sdk",
          recordedAt: "2026-01-11T00:00:00.000Z",
          openIssues: 20,
          commitCount30d: 40,
          contributorCount: 10,
          lastCommitAt: "2026-01-10T00:00:00.000Z",
          lastReleaseAt: "2025-12-20T00:00:00.000Z",
          healthScoreVersion: 1,
        },
        {
          repositoryId: "seed-mastra-ai-mastra",
          recordedAt: latestRecordedAt,
          openIssues: 220,
          commitCount30d: null,
          contributorCount: 1,
          lastCommitAt: "2025-01-01T00:00:00.000Z",
          lastReleaseAt: null,
          healthScoreVersion: 1,
        },
      ])
      .run();
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

  it("returns category detail sorted by health score with nullable metrics", async () => {
    const response = await app.request("/api/categories/llm");

    expect(response.status).toBe(200);
    const json = await response.json();
    const parsed = CategoryDetailResponseSchema.parse(json);

    expect(parsed.data.repositories.length).toBeGreaterThan(1);
    const first = parsed.data.repositories[0];
    const second = parsed.data.repositories[1];
    expect(first?.metrics.devHealth.healthScore).toBeGreaterThanOrEqual(
      second?.metrics.devHealth.healthScore ?? 0,
    );
    expect(first?.metrics.devHealth.issueGrowth30d).toBe(10);
    expect(second?.metrics.devHealth.issueGrowth30d).toBeNull();
    expect(second?.metrics.devHealth.commitLast30d).toBeNull();
    expect(first?.metrics.adoption).toBeNull();
    expect(first?.metrics.security).toBeNull();
    expect(first?.metrics.governance).toBeNull();
  });

  it("returns CATEGORY_NOT_FOUND for unknown slug", async () => {
    const response = await app.request("/api/categories/unknown");

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("CATEGORY_NOT_FOUND");
  });
});
