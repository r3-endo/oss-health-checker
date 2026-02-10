import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HttpRepositoryApiAdapter,
  RepositoryApiError,
} from "../src/features/repositories/api/repository-api-adapter";

describe("HttpRepositoryApiAdapter", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("normalizes API error response into RepositoryApiError", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    global.fetch = vi.fn().mockResolvedValue(
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

    await expect(adapter.listRepositories()).rejects.toMatchObject<
      Partial<RepositoryApiError>
    >({
      name: "RepositoryApiError",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("parses successful repository list response", async () => {
    const adapter = new HttpRepositoryApiAdapter("");

    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "repo-1",
              url: "https://github.com/o/r",
              owner: "o",
              name: "r",
              status: "Active",
              warningReasons: [],
              lastCommitAt: "2026-02-10T00:00:00.000Z",
              lastReleaseAt: null,
              openIssuesCount: 1,
              contributorsCount: 1,
              fetchedAt: "2026-02-10T00:00:00.000Z",
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
    expect(repositories[0]?.status).toBe("Active");
  });
});
