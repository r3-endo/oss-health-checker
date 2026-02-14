import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildApp } from "@oss-health-checker/common/shared/bootstrap/build-app.js";
import { buildContainer } from "@oss-health-checker/common/shared/bootstrap/build-container.js";
import type { AppEnv } from "@oss-health-checker/common/shared/config/env.js";

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

describe("display api db read-only contract", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "oss-health-checker-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("serves list endpoints from DB snapshots without external API calls", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => {
        throw new Error("External fetch must not run in display APIs");
      });

    const env = createTestEnv(path.join(tempDir, "test.sqlite"));
    const app = buildApp(buildContainer(env));

    const dashboardResponse = await app.request("/api/dashboard/repositories");
    const repositoriesResponse = await app.request("/api/repositories");
    const categoriesResponse = await app.request("/api/categories");

    expect(dashboardResponse.status).toBe(200);
    expect(repositoriesResponse.status).toBe(200);
    expect(categoriesResponse.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
