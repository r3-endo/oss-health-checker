import { describe, expect, it } from "vitest";
import { RegistryProviderResolver } from "../../src/features/ecosystem-adoption/infrastructure/providers/registry-provider-resolver.js";

describe("RegistryProviderResolver", () => {
  it("returns null when a provider source is disabled", () => {
    const npmProvider = {
      source: "npm" as const,
      fetchPackageAdoption: async () => ({
        packageName: "react",
        weeklyDownloads: 1,
        downloadsDelta7d: null,
        downloadsDelta30d: null,
        lastPublishedAt: null,
        latestVersion: null,
      }),
    };

    const resolver = new RegistryProviderResolver([npmProvider], []);

    expect(resolver.resolve("npm")).toBeNull();
  });
});
