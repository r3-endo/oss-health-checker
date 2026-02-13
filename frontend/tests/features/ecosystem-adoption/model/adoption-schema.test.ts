import { describe, expect, it } from "vitest";
import { RepositoryAdoptionSchema } from "../../../../src/features/ecosystem-adoption/model/schemas";

describe("RepositoryAdoptionSchema", () => {
  it("accepts all valid mappingStatus/adoptionFetchStatus combinations", () => {
    expect(
      RepositoryAdoptionSchema.parse({
        mappingStatus: "mapped",
        adoptionFetchStatus: "succeeded",
        source: "npm",
        packageName: "react",
        weeklyDownloads: 100,
        downloadsDelta7d: 5,
        downloadsDelta30d: 12,
        lastPublishedAt: "2026-02-13T00:00:00.000Z",
        latestVersion: "1.0.0",
        fetchedAt: "2026-02-13T00:00:00.000Z",
      }),
    ).toMatchObject({
      mappingStatus: "mapped",
      adoptionFetchStatus: "succeeded",
    });

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
    ).toMatchObject({ mappingStatus: "mapped", adoptionFetchStatus: "failed" });

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
    ).toMatchObject({
      mappingStatus: "not_mapped",
      adoptionFetchStatus: "not_applicable",
    });
  });

  it("rejects invalid truth-table combinations", () => {
    const parsed = RepositoryAdoptionSchema.safeParse({
      mappingStatus: "not_mapped",
      adoptionFetchStatus: "failed",
      source: null,
      packageName: null,
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
