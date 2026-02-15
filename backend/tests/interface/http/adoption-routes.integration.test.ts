import { describe, expect, it } from "vitest";
import { buildApp } from "../../../../apps/backend/src/build-app.js";

describe("adoption routes integration", () => {
  it("exposes adoption refresh route", async () => {
    const app = buildApp({
      categoryController: {
        listCategories: async () => ({ data: [] }),
        getCategoryDetail: async () => ({
          data: {
            slug: "llm",
            name: "LLM",
            updatedAt: "2026-02-13T00:00:00.000Z",
            repositories: [],
          },
        }),
      } as never,
      repositoryController: {
        list: async () => ({ data: [] }),
        create: async () => ({ data: null }),
        refresh: async () => ({ data: null }),
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

    const response = await app.request(
      "/api/repositories/repo-1/adoption/refresh",
      {
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.adoption.mappingStatus).toBe("not_mapped");
  });
});
