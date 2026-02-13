import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HttpRepositoryApiAdapter,
  RepositoryApiError,
} from "../../../../src/features/repositories/api/repository-api-adapter";

describe("HttpRepositoryApiAdapter", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("normalizes API error response into RepositoryApiError", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "invalid url" },
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    await expect(adapter.listRepositories()).rejects.toMatchObject({
      name: "RepositoryApiError",
      status: 400,
      code: "VALIDATION_ERROR",
    } satisfies Partial<RepositoryApiError>);
  });

  it("parses successful category summary list response", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { slug: "llm", name: "LLM", displayOrder: 0 },
            { slug: "backend", name: "Backend", displayOrder: 1 },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    const categories = await adapter.listCategories();
    expect(categories).toHaveLength(2);
    expect(categories[0]?.slug).toBe("llm");
  });

  it("parses successful category detail response", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            slug: "llm",
            name: "LLM",
            repositories: [
              {
                owner: {
                  login: "octo",
                  type: "User",
                },
                name: "repo",
                github: {
                  stars: 100,
                  openIssues: 2,
                  openPRs: 7,
                  lastCommitToDefaultBranchAt: "2026-02-10T00:00:00.000Z",
                  defaultBranch: "main",
                  dataStatus: "ok",
                  errorMessage: null,
                },
                links: {
                  repo: "https://github.com/octo/repo",
                },
              },
            ],
            updatedAt: "2026-02-13T00:00:00.000Z",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    const detail = await adapter.getCategoryDetail("llm");
    expect(detail.slug).toBe("llm");
    expect(detail.repositories[0]?.name).toBe("repo");
    expect(detail.repositories[0]?.github.openPRs).toBe(7);
  });

  it("parses successful repository list response", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              repository: {
                id: "repo-1",
                url: "https://github.com/o/r",
                owner: "o",
                name: "r",
                createdAt: "2026-02-10T00:00:00.000Z",
                updatedAt: "2026-02-10T00:00:00.000Z",
              },
              snapshot: {
                repositoryId: "repo-1",
                status: "Active",
                warningReasons: [],
                lastCommitAt: "2026-02-10T00:00:00.000Z",
                lastReleaseAt: null,
                openIssuesCount: 1,
                contributorsCount: 1,
                fetchedAt: "2026-02-10T00:00:00.000Z",
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    const repositories = await adapter.listRepositories();
    expect(repositories).toHaveLength(1);
    expect(repositories[0]?.owner).toBe("o");
    expect(repositories[0]?.status).toBe("Active");
  });

  it("normalizes refresh API error response into RepositoryApiError", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "RATE_LIMIT", message: "rate limited" },
        }),
        {
          status: 429,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as typeof fetch;

    await expect(adapter.refreshRepository("repo-1")).rejects.toMatchObject({
      name: "RepositoryApiError",
      status: 429,
      code: "RATE_LIMIT",
    } satisfies Partial<RepositoryApiError>);
  });
});
