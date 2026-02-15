import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RegistryAdoptionTable } from "../../../../src/features/registry-adoption/ui/components/RegistryAdoptionTable";
import type { RegistryAdoptionRow } from "../../../../src/features/registry-adoption/model/schemas";

const rows: readonly RegistryAdoptionRow[] = [
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
  {
    repository: {
      id: "repo-2",
      url: "https://github.com/acme/repo-2",
      owner: "acme",
      name: "repo-2",
      createdAt: "2026-02-10T00:00:00.000Z",
      updatedAt: "2026-02-10T00:00:00.000Z",
    },
    snapshot: null,
    adoption: {
      mappingStatus: "mapped",
      adoptionFetchStatus: "failed",
      source: "npm",
      packageName: "pkg-2",
      weeklyDownloads: 120,
      downloadsDelta7d: null,
      downloadsDelta30d: null,
      lastPublishedAt: null,
      latestVersion: "1.0.0",
      fetchedAt: "2026-02-11T00:00:00.000Z",
    },
  },
];

describe("RegistryAdoptionTable", () => {
  it("renders adoption columns", () => {
    const html = renderToStaticMarkup(<RegistryAdoptionTable rows={rows} />);

    expect(html).toContain("Package Name");
    expect(html).toContain("Weekly Downloads");
    expect(html).toContain("Latest Version");
  });

  it("renders Not Mapped for not_mapped rows", () => {
    const html = renderToStaticMarkup(<RegistryAdoptionTable rows={rows} />);
    expect(html).toContain("Not Mapped");
  });

  it("shows update failure feedback while keeping previous adoption values", () => {
    const html = renderToStaticMarkup(<RegistryAdoptionTable rows={rows} />);

    expect(html).toContain("Update failed");
    expect(html).toContain("pkg-2");
  });
});
