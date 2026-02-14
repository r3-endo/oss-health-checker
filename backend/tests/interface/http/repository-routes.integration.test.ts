import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RepositoryGatewayError,
  type RepositoryGatewayPort,
} from "@oss-health-checker/common/features/development-health/application/ports/repository-gateway-port.js";
import { ListRepositoriesWithLatestSnapshotService } from "@oss-health-checker/common/features/development-health/application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { RefreshRepositoryService } from "@oss-health-checker/common/features/development-health/application/use-cases/refresh-repository-use-case.js";
import { RegisterRepositoryService } from "@oss-health-checker/common/features/development-health/application/use-cases/register-repository-use-case.js";
import { buildApp } from "@oss-health-checker/common/shared/bootstrap/build-app.js";
import type { AppEnv } from "@oss-health-checker/common/shared/config/env.js";
import { createDrizzleHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleRepositoryAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleRepositoryReadModelAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.js";
import { DrizzleRepositorySnapshotAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-snapshot-adapter.js";
import { DrizzleSnapshotAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-snapshot-adapter.js";
import { DrizzleUnitOfWorkAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { RepositoryController } from "@oss-health-checker/common/features/development-health/interface/http/controllers/repository-controller.js";

type MutableSignals = {
  lastCommitAt: Date;
  lastReleaseAt: Date | null;
  openIssuesCount: number;
  contributorsCount: number;
};

class InMemoryRepositoryGateway implements RepositoryGatewayPort {
  private readonly signalsByRepo = new Map<string, MutableSignals>();
  private readonly failureByRepo = new Map<string, unknown>();

  setSignals(owner: string, name: string, signals: MutableSignals): void {
    this.signalsByRepo.set(`${owner}/${name}`, signals);
    this.failureByRepo.delete(`${owner}/${name}`);
  }

  setFailure(owner: string, name: string, error: unknown): void {
    this.failureByRepo.set(`${owner}/${name}`, error);
  }

  async fetchSignals(owner: string, name: string): Promise<MutableSignals> {
    const failure = this.failureByRepo.get(`${owner}/${name}`);
    if (failure) {
      throw failure;
    }

    const signals = this.signalsByRepo.get(`${owner}/${name}`);
    if (!signals) {
      throw new Error(`Missing fixture for ${owner}/${name}`);
    }

    return Object.freeze({ ...signals });
  }
}

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

const requestJson = (body: unknown): Readonly<RequestInit> => ({
  method: "POST",
  headers: new Headers({ "Content-Type": "application/json" }),
  body: JSON.stringify(body),
});

const toUtcDayStartIso = (date: Date): string =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ).toISOString();

describe("repository routes integration", () => {
  let tempDir: string;
  let app: ReturnType<typeof buildApp>;
  let gateway: InMemoryRepositoryGateway;
  let repositorySnapshotAdapter: DrizzleRepositorySnapshotAdapter;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "oss-health-checker-"));
    const databasePath = path.join(tempDir, "test.sqlite");

    const db = createDrizzleHandle(createTestEnv(databasePath));
    migrateDrizzleDatabase(db);

    const repositoryPort = new DrizzleRepositoryAdapter(db);
    const snapshotPort = new DrizzleSnapshotAdapter(db);
    repositorySnapshotAdapter = new DrizzleRepositorySnapshotAdapter(db);
    const repositoryReadModelPort = new DrizzleRepositoryReadModelAdapter(db);
    const unitOfWork = new DrizzleUnitOfWorkAdapter(db);

    gateway = new InMemoryRepositoryGateway();

    const registerRepositoryUseCase = new RegisterRepositoryService(
      unitOfWork,
      gateway,
    );
    const listRepositoriesUseCase =
      new ListRepositoriesWithLatestSnapshotService(repositoryReadModelPort);
    const refreshRepositoryUseCase = new RefreshRepositoryService(
      repositoryPort,
      snapshotPort,
      repositorySnapshotAdapter,
      gateway,
    );

    const repositoryController = new RepositoryController(
      listRepositoriesUseCase,
      registerRepositoryUseCase,
      refreshRepositoryUseCase,
    );

    app = buildApp({
      categoryController: {
        listCategories: async () => ({ data: [] }),
        getCategoryDetail: async () => ({
          data: {
            slug: "llm",
            name: "Large Language Models",
            repositories: [],
          },
        }),
      } as never,
      repositoryController,
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

  it("registers a repository and creates initial snapshot", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: new Date("2025-12-01T00:00:00Z"),
      openIssuesCount: 4,
      contributorsCount: 11,
    });

    const response = await app.request(
      "/api/repositories",
      requestJson({
        url: "https://github.com/octocat/Hello-World",
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.repository.owner).toBe("octocat");
    expect(body.data.snapshot.status).toBe("Active");
    expect(body.data.snapshot.contributorsCount).toBe(11);
  });

  it("returns repositories with latest snapshot fields", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 140,
      contributorsCount: 2,
    });

    await app.request(
      "/api/repositories",
      requestJson({
        url: "https://github.com/octocat/Hello-World",
      }),
    );

    const response = await app.request("/api/repositories");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].repository.name).toBe("Hello-World");
    expect(body.data[0].snapshot.openIssuesCount).toBe(140);
    expect(body.data[0].snapshot.warningReasons).toContain("open_issues_high");
  });

  it("refreshes an existing repository", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: new Date("2026-01-09T00:00:00Z"),
      openIssuesCount: 4,
      contributorsCount: 11,
    });

    const createResponse = await app.request(
      "/api/repositories",
      requestJson({
        url: "https://github.com/octocat/Hello-World",
      }),
    );
    const created = await createResponse.json();

    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2024-01-01T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 150,
      contributorsCount: 13,
    });

    const response = await app.request(
      `/api/repositories/${created.data.repository.id}/refresh`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.ok).toBe(true);
    expect(body.data.snapshot.status).toBe("Risky");
    expect(body.data.snapshot.warningReasons).toContain("open_issues_high");
  });

  it("manual refresh upserts one daily snapshot per UTC day", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: new Date("2026-01-09T00:00:00Z"),
      openIssuesCount: 4,
      contributorsCount: 11,
    });

    const createResponse = await app.request(
      "/api/repositories",
      requestJson({
        url: "https://github.com/octocat/Hello-World",
      }),
    );
    const created = await createResponse.json();
    const repositoryId = created.data.repository.id as string;

    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-11T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 10,
      contributorsCount: 8,
    });
    await app.request(`/api/repositories/${repositoryId}/refresh`, {
      method: "POST",
    });

    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-12T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 15,
      contributorsCount: 8,
    });
    await app.request(`/api/repositories/${repositoryId}/refresh`, {
      method: "POST",
    });

    const recordedAt = toUtcDayStartIso(new Date());
    await expect(
      repositorySnapshotAdapter.countSnapshots(repositoryId),
    ).resolves.toBe(1);
    await expect(
      repositorySnapshotAdapter.getSnapshot(repositoryId, recordedAt),
    ).resolves.toEqual({
      openIssues: 15,
      commitCount30d: null,
    });
  });

  it("manual refresh keeps previous daily snapshot when GitHub fetch fails", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: new Date("2026-01-09T00:00:00Z"),
      openIssuesCount: 4,
      contributorsCount: 11,
    });

    const createResponse = await app.request(
      "/api/repositories",
      requestJson({
        url: "https://github.com/octocat/Hello-World",
      }),
    );
    const created = await createResponse.json();
    const repositoryId = created.data.repository.id as string;

    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-12T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 12,
      contributorsCount: 7,
    });
    await app.request(`/api/repositories/${repositoryId}/refresh`, {
      method: "POST",
    });

    gateway.setFailure(
      "octocat",
      "Hello-World",
      new RepositoryGatewayError("RATE_LIMIT", "rate limited", {
        retryAfterSeconds: 60,
      }),
    );

    const failedRefreshResponse = await app.request(
      `/api/repositories/${repositoryId}/refresh`,
      { method: "POST" },
    );
    expect(failedRefreshResponse.status).toBe(429);

    const recordedAt = toUtcDayStartIso(new Date());
    await expect(
      repositorySnapshotAdapter.countSnapshots(repositoryId),
    ).resolves.toBe(1);
    await expect(
      repositorySnapshotAdapter.getSnapshot(repositoryId, recordedAt),
    ).resolves.toEqual({
      openIssues: 12,
      commitCount30d: null,
    });
  });

  it("returns validation error for invalid URL", async () => {
    const response = await app.request(
      "/api/repositories",
      requestJson({
        url: "https://example.com/not-github",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when repository limit exceeds 3", async () => {
    gateway.setSignals("o1", "r1", {
      lastCommitAt: new Date("2026-01-01T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 1,
      contributorsCount: 1,
    });
    gateway.setSignals("o2", "r2", {
      lastCommitAt: new Date("2026-01-01T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 1,
      contributorsCount: 1,
    });
    gateway.setSignals("o3", "r3", {
      lastCommitAt: new Date("2026-01-01T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 1,
      contributorsCount: 1,
    });
    gateway.setSignals("o4", "r4", {
      lastCommitAt: new Date("2026-01-01T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 1,
      contributorsCount: 1,
    });

    await app.request(
      "/api/repositories",
      requestJson({ url: "https://github.com/o1/r1" }),
    );
    await app.request(
      "/api/repositories",
      requestJson({ url: "https://github.com/o2/r2" }),
    );
    await app.request(
      "/api/repositories",
      requestJson({ url: "https://github.com/o3/r3" }),
    );

    const response = await app.request(
      "/api/repositories",
      requestJson({ url: "https://github.com/o4/r4" }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns not found error when refreshing unknown repository id", async () => {
    const response = await app.request("/api/repositories/unknown/refresh", {
      method: "POST",
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns rate-limit error when refresh gateway is throttled", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 2,
      contributorsCount: 5,
    });
    const created = await (
      await app.request(
        "/api/repositories",
        requestJson({ url: "https://github.com/octocat/Hello-World" }),
      )
    ).json();

    gateway.setFailure(
      "octocat",
      "Hello-World",
      new RepositoryGatewayError("RATE_LIMIT", "rate limited", {
        status: 429,
        retryAfterSeconds: 120,
      }),
    );

    const response = await app.request(
      `/api/repositories/${created.data.repository.id}/refresh`,
      { method: "POST" },
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMIT");
    expect(body.error.detail.retryAfterSeconds).toBe(120);
  });

  it("keeps previous snapshot after refresh failure and returns failure result", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 2,
      contributorsCount: 5,
    });
    const created = await (
      await app.request(
        "/api/repositories",
        requestJson({ url: "https://github.com/octocat/Hello-World" }),
      )
    ).json();

    const beforeRefreshList = await (
      await app.request("/api/repositories")
    ).json();
    const beforeSnapshot = beforeRefreshList.data[0].snapshot;

    gateway.setFailure(
      "octocat",
      "Hello-World",
      new RepositoryGatewayError("RATE_LIMIT", "rate limited", {
        status: 429,
        retryAfterSeconds: 60,
      }),
    );

    const refreshResponse = await app.request(
      `/api/repositories/${created.data.repository.id}/refresh`,
      { method: "POST" },
    );

    expect(refreshResponse.status).toBe(429);
    const refreshBody = await refreshResponse.json();
    expect(refreshBody.error.code).toBe("RATE_LIMIT");

    const afterRefreshList = await (
      await app.request("/api/repositories")
    ).json();
    const afterSnapshot = afterRefreshList.data[0].snapshot;

    expect(afterSnapshot).toEqual(beforeSnapshot);
  });

  it("returns external API error when refresh gateway fails upstream", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 2,
      contributorsCount: 5,
    });
    const created = await (
      await app.request(
        "/api/repositories",
        requestJson({ url: "https://github.com/octocat/Hello-World" }),
      )
    ).json();

    gateway.setFailure(
      "octocat",
      "Hello-World",
      new RepositoryGatewayError("API_ERROR", "upstream failed", {
        status: 502,
      }),
    );

    const response = await app.request(
      `/api/repositories/${created.data.repository.id}/refresh`,
      { method: "POST" },
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.code).toBe("EXTERNAL_API_ERROR");
    expect(body.error.detail.status).toBe(502);
  });

  it("returns internal error when refresh fails unexpectedly", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 2,
      contributorsCount: 5,
    });
    const created = await (
      await app.request(
        "/api/repositories",
        requestJson({ url: "https://github.com/octocat/Hello-World" }),
      )
    ).json();

    gateway.setFailure("octocat", "Hello-World", new Error("unexpected"));

    const response = await app.request(
      `/api/repositories/${created.data.repository.id}/refresh`,
      { method: "POST" },
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Failed to refresh");
  });

  it("does not create duplicate repository when repository URL is duplicated", async () => {
    gateway.setSignals("octocat", "Hello-World", {
      lastCommitAt: new Date("2026-01-10T00:00:00Z"),
      lastReleaseAt: null,
      openIssuesCount: 2,
      contributorsCount: 5,
    });

    await app.request(
      "/api/repositories",
      requestJson({ url: "https://github.com/octocat/Hello-World" }),
    );

    const response = await app.request(
      "/api/repositories",
      requestJson({ url: "https://github.com/octocat/Hello-World" }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.repository.owner).toBe("octocat");

    const listResponse = await app.request("/api/repositories");
    const listBody = await listResponse.json();
    expect(listBody.data).toHaveLength(1);
  });
});
