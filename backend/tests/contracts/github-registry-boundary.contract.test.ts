import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/shared/bootstrap/build-app.js";

describe("github/registry boundary contract", () => {
  it("keeps GitHub list endpoint dev-health only and serves adoption via dashboard endpoint", async () => {
    const app = buildApp({
      categoryController: {
        listCategories: async () => ({ data: [] }),
        getCategoryDetail: async () => ({ data: null }),
      } as never,
      repositoryController: {
        list: async () => ({
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
            },
          ],
        }),
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

    const githubRes = await app.request("/api/repositories");
    const githubBody = await githubRes.json();

    expect(githubRes.status).toBe(200);
    expect(githubBody.data[0].snapshot).toBeNull();
    expect("adoption" in githubBody.data[0]).toBe(false);

    const registryRes = await app.request("/api/dashboard/repositories");
    const registryBody = await registryRes.json();

    expect(registryRes.status).toBe(200);
    expect(registryBody.data[0].adoption.mappingStatus).toBe("not_mapped");
  });
});
