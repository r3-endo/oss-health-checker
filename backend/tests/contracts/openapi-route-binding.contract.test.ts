import { describe, expect, it } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRepositoryRoutes } from "../../src/interface/http/routes/repository-routes";

const normalizePathParams = (path: string): string =>
  path.replace(/:([^/]+)/g, "{$1}");

const createContractApp = (): OpenAPIHono => {
  const app = new OpenAPIHono();
  const controller = {
    create: async () => ({
      data: {
        repository: {
          id: "r1",
          url: "https://github.com/octocat/Hello-World",
          owner: "octocat",
          name: "Hello-World",
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
        snapshot: {
          repositoryId: "r1",
          lastCommitAt: new Date("2026-01-02T00:00:00Z"),
          lastReleaseAt: null,
          openIssuesCount: 1,
          contributorsCount: 1,
          status: "Active" as const,
          warningReasons: [] as const,
          fetchedAt: new Date("2026-01-02T00:00:00Z"),
        },
      },
    }),
    list: async () => ({ data: [] }),
    refresh: async () => ({
      data: {
        ok: true as const,
        snapshot: {
          repositoryId: "r1",
          lastCommitAt: new Date("2026-01-02T00:00:00Z"),
          lastReleaseAt: null,
          openIssuesCount: 1,
          contributorsCount: 1,
          status: "Active" as const,
          warningReasons: [] as const,
          fetchedAt: new Date("2026-01-02T00:00:00Z"),
        },
      },
    }),
  };

  app.route("/api", createRepositoryRoutes(controller as never));
  app.post("/api/runtime-only", (c) => c.json({ ok: true }, 201));
  app.doc("/api/openapi.json", {
    openapi: "3.0.0",
    info: { title: "contract-test", version: "1.0.0" },
  });
  return app;
};

describe("openapi route binding contract baseline", () => {
  it("exposes the three repository endpoints used by the runtime contract", async () => {
    const app = createContractApp();

    const createResponse = await app.request("/api/repositories", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        url: "https://github.com/octocat/Hello-World",
      }),
    });
    const listResponse = await app.request("/api/repositories", {
      method: "GET",
    });
    const refreshResponse = await app.request("/api/repositories/r1/refresh", {
      method: "POST",
    });

    expect(createResponse.status).toBe(201);
    expect(listResponse.status).toBe(200);
    expect(refreshResponse.status).toBe(200);
  });

  it("fails contract verification when runtime endpoints are missing from OpenAPI bindings", async () => {
    const app = createContractApp();

    const openApiResponse = await app.request("/api/openapi.json");
    expect(openApiResponse.status).toBe(200);

    const openApiDocument = (await openApiResponse.json()) as {
      paths: Record<string, unknown>;
    };

    const runtimePaths = new Set(
      app.routes
        .filter((route) => route.path.startsWith("/api/"))
        .filter((route) => route.path !== "/api/openapi.json")
        .filter((route) => route.method !== "OPTIONS")
        .map((route) => normalizePathParams(route.path)),
    );
    const openApiPaths = new Set(Object.keys(openApiDocument.paths));

    const missing = [...runtimePaths]
      .filter((path) => !openApiPaths.has(path))
      .sort();
    expect(missing).toEqual(["/api/runtime-only"]);
  });
});
