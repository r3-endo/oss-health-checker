import { afterEach, describe, expect, it, vi } from "vitest";
import { NpmRegistryProviderAdapter } from "../../src/features/ecosystem-adoption/infrastructure/providers/npm/npm-registry-provider-adapter.js";

describe("NpmRegistryProviderAdapter", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("throws RATE_LIMIT on npm 429", async () => {
    const adapter = new NpmRegistryProviderAdapter({
      NODE_ENV: "test",
      GITHUB_API_BASE_URL: "https://api.github.com",
      GITHUB_TOKEN: undefined,
      GITHUB_API_TIMEOUT_MS: 1000,
      DATABASE_URL: "file:test.sqlite",
      CORS_ALLOWED_ORIGINS: ["http://localhost:5173"],
      NPM_REGISTRY_API_BASE_URL: "https://registry.npmjs.org",
      NPM_DOWNLOADS_API_BASE_URL: "https://api.npmjs.org/downloads",
      NPM_REGISTRY_TIMEOUT_MS: 1000,
      ADOPTION_ENABLED_SOURCES: ["npm"],
    });

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
      }),
    ) as typeof fetch;

    await expect(adapter.fetchPackageAdoption("react")).rejects.toMatchObject({
      code: "RATE_LIMIT",
    });
  });

  it("normalizes downloads/version/published fields", async () => {
    const adapter = new NpmRegistryProviderAdapter({
      NODE_ENV: "test",
      GITHUB_API_BASE_URL: "https://api.github.com",
      GITHUB_TOKEN: undefined,
      GITHUB_API_TIMEOUT_MS: 1000,
      DATABASE_URL: "file:test.sqlite",
      CORS_ALLOWED_ORIGINS: ["http://localhost:5173"],
      NPM_REGISTRY_API_BASE_URL: "https://registry.npmjs.org",
      NPM_DOWNLOADS_API_BASE_URL: "https://api.npmjs.org/downloads",
      NPM_REGISTRY_TIMEOUT_MS: 1000,
      ADOPTION_ENABLED_SOURCES: ["npm"],
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ downloads: 12345 }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "dist-tags": { latest: "19.0.0" },
            time: {
              "19.0.0": "2026-02-10T00:00:00.000Z",
            },
          }),
          { status: 200 },
        ),
      ) as typeof fetch;

    const result = await adapter.fetchPackageAdoption("react");

    expect(result).toEqual({
      packageName: "react",
      weeklyDownloads: 12345,
      downloadsDelta7d: null,
      downloadsDelta30d: null,
      lastPublishedAt: "2026-02-10T00:00:00.000Z",
      latestVersion: "19.0.0",
    });
  });
});
