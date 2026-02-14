import { describe, expect, it } from "vitest";
import { RepositoryAdoptionSchema } from "@oss-health-checker/common/features/ecosystem-adoption/interface/http/openapi/schemas.js";

describe("adoption openapi truth table contract", () => {
  it("accepts mapped/succeeded, mapped/failed and not_mapped/not_applicable", () => {
    expect(
      RepositoryAdoptionSchema.parse({
        mappingStatus: "mapped",
        adoptionFetchStatus: "succeeded",
        source: "npm",
        packageName: "react",
        weeklyDownloads: 100,
        downloadsDelta7d: 10,
        downloadsDelta30d: 20,
        lastPublishedAt: "2026-02-13T00:00:00.000Z",
        latestVersion: "1.0.0",
        fetchedAt: "2026-02-13T00:00:00.000Z",
      }),
    ).toBeDefined();

    expect(
      RepositoryAdoptionSchema.parse({
        mappingStatus: "mapped",
        adoptionFetchStatus: "failed",
        source: "npm",
        packageName: "react",
        weeklyDownloads: 100,
        downloadsDelta7d: null,
        downloadsDelta30d: null,
        lastPublishedAt: null,
        latestVersion: null,
        fetchedAt: null,
      }),
    ).toBeDefined();

    expect(
      RepositoryAdoptionSchema.parse({
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
      }),
    ).toBeDefined();
  });

  it("rejects invalid combinations", () => {
    const parsed = RepositoryAdoptionSchema.safeParse({
      mappingStatus: "mapped",
      adoptionFetchStatus: "not_applicable",
      source: "npm",
      packageName: "react",
      weeklyDownloads: null,
      downloadsDelta7d: null,
      downloadsDelta30d: null,
      lastPublishedAt: null,
      latestVersion: null,
      fetchedAt: null,
    });

    expect(parsed.success).toBe(false);
  });
});
