import { describe, expect, it } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createDashboardRoutes } from "@backend/src/features/dashboard-overview/interface/http/routes/dashboard-routes.js";

const createContractApp = (): OpenAPIHono => {
  const app = new OpenAPIHono();
  const controller = {
    listRepositories: async () => ({
      data: [
        {
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
          adoption: {
            mappingStatus: "not_mapped" as const,
            adoptionFetchStatus: "not_applicable" as const,
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
      ],
    }),
  };

  app.route("/api", createDashboardRoutes(controller as never));
  app.doc("/api/openapi.json", {
    openapi: "3.0.0",
    info: { title: "contract-test", version: "1.0.0" },
  });
  return app;
};

describe("dashboard overview openapi contract", () => {
  it("binds /api/dashboard/repositories to OpenAPI and returns integrated row shape", async () => {
    const app = createContractApp();

    const listResponse = await app.request("/api/dashboard/repositories", {
      method: "GET",
    });
    expect(listResponse.status).toBe(200);

    const openApiResponse = await app.request("/api/openapi.json");
    expect(openApiResponse.status).toBe(200);
    const openApiDocument = (await openApiResponse.json()) as {
      paths: Record<string, unknown>;
    };

    expect(openApiDocument.paths["/api/dashboard/repositories"]).toBeDefined();
  });
});
