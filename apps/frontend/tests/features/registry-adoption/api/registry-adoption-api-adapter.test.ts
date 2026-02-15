import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HttpRegistryAdoptionApiAdapter,
  RegistryAdoptionApiError,
} from "../../../../src/features/registry-adoption/api/registry-adoption-api-adapter";

describe("HttpRegistryAdoptionApiAdapter", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses successful adoption rows", async () => {
    const adapter = new HttpRegistryAdoptionApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              repository: {
                id: "repo-1",
                url: "https://github.com/acme/repo-1",
                owner: "acme",
                name: "repo-1",
                createdAt: "2026-02-10T00:00:00.000Z",
                updatedAt: "2026-02-10T00:00:00.000Z",
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
      ),
    ) as typeof fetch;

    const rows = await adapter.listRepositories();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.adoption.mappingStatus).toBe("not_mapped");
  });

  it("normalizes error response", async () => {
    const adapter = new HttpRegistryAdoptionApiAdapter("");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "boom" },
        }),
        { status: 500 },
      ),
    ) as typeof fetch;

    await expect(adapter.listRepositories()).rejects.toMatchObject({
      name: "RegistryAdoptionApiError",
      status: 500,
      code: "INTERNAL_ERROR",
    } satisfies Partial<RegistryAdoptionApiError>);
  });
});
