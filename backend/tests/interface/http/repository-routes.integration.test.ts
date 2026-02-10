import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { RepositoryGatewayPort } from "../../../src/application/ports/repository-gateway-port";
import { ListRepositoriesWithLatestSnapshotService } from "../../../src/application/use-cases/list-repositories-with-latest-snapshot-use-case";
import { RefreshRepositoryService } from "../../../src/application/use-cases/refresh-repository-use-case";
import { RegisterRepositoryService } from "../../../src/application/use-cases/register-repository-use-case";
import { buildApp } from "../../../src/bootstrap/build-app";
import type { AppEnv } from "../../../src/infrastructure/config/env";
import { createDrizzleHandle } from "../../../src/infrastructure/db/drizzle/client";
import { migrateDrizzleDatabase } from "../../../src/infrastructure/db/drizzle/migrate";
import { DrizzleRepositoryAdapter } from "../../../src/infrastructure/repositories/drizzle-repository-adapter";
import { DrizzleRepositoryReadModelAdapter } from "../../../src/infrastructure/repositories/drizzle-repository-read-model-adapter";
import { DrizzleSnapshotAdapter } from "../../../src/infrastructure/repositories/drizzle-snapshot-adapter";
import { RepositoryController } from "../../../src/interface/http/controllers/repository-controller";

type MutableSignals = {
  lastCommitAt: Date;
  lastReleaseAt: Date | null;
  openIssuesCount: number;
  contributorsCount: number;
};

class InMemoryRepositoryGateway implements RepositoryGatewayPort {
  private readonly signalsByRepo = new Map<string, MutableSignals>();

  setSignals(owner: string, name: string, signals: MutableSignals): void {
    this.signalsByRepo.set(`${owner}/${name}`, signals);
  }

  async fetchSignals(owner: string, name: string): Promise<MutableSignals> {
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
  });

const requestJson = (body: unknown): Readonly<RequestInit> => ({
  method: "POST",
  headers: new Headers({ "Content-Type": "application/json" }),
  body: JSON.stringify(body),
});

describe("repository routes integration", () => {
  let tempDir: string;
  let app: ReturnType<typeof buildApp>;
  let gateway: InMemoryRepositoryGateway;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "oss-health-checker-"));
    const databasePath = path.join(tempDir, "test.sqlite");

    const db = createDrizzleHandle(createTestEnv(databasePath));
    migrateDrizzleDatabase(db);

    const repositoryPort = new DrizzleRepositoryAdapter(db);
    const snapshotPort = new DrizzleSnapshotAdapter(db);
    const repositoryReadModelPort = new DrizzleRepositoryReadModelAdapter(db);

    gateway = new InMemoryRepositoryGateway();

    const registerRepositoryUseCase = new RegisterRepositoryService(
      repositoryPort,
      snapshotPort,
      gateway,
    );
    const listRepositoriesUseCase =
      new ListRepositoriesWithLatestSnapshotService(repositoryReadModelPort);
    const refreshRepositoryUseCase = new RefreshRepositoryService(
      repositoryPort,
      snapshotPort,
      gateway,
    );

    const repositoryController = new RepositoryController(
      listRepositoriesUseCase,
      registerRepositoryUseCase,
      refreshRepositoryUseCase,
    );

    app = buildApp({
      repositoryController,
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

  it("returns validation error when repository URL is duplicated", async () => {
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

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.detail.reason).toBe("duplicate_repository_url");
  });
});
