import { describe, expect, it } from "vitest";
import { buildApp } from "@backend/src/build-app.js";

describe("dashboard routes integration", () => {
  it("returns dashboard repositories payload", async () => {
    const app = buildApp({
      categoryController: {
        listCategories: async () => ({ data: [] }),
        getCategoryDetail: async () => ({ data: null }),
      } as never,
      repositoryController: {
        list: async () => ({ data: [] }),
        create: async () => ({ data: null }),
        refresh: async () => ({ data: null }),
      } as never,
      adoptionController: {
        refresh: async () => ({ data: null }),
      } as never,
      dashboardController: {
        listRepositories: async () => ({
          data: [
            {
              repository: {
                id: "repo-1",
                url: "https://github.com/acme/repo-1",
                owner: "acme",
                name: "repo-1",
                createdAt: "2026-02-01T00:00:00.000Z",
                updatedAt: "2026-02-01T00:00:00.000Z",
              },
              snapshot: null,
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
          ],
        }),
      } as never,
      corsAllowedOrigins: ["http://localhost:5173"],
    });

    const response = await app.request("/api/dashboard/repositories");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].repository.id).toBe("repo-1");
  });
});
