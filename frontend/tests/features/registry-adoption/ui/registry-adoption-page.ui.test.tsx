import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RegistryAdoptionPage } from "../../../../src/features/registry-adoption/ui/pages/RegistryAdoptionPage";

vi.mock(
  "../../../../src/features/registry-adoption/hooks/use-registry-adoption-repositories-query",
  () => ({
    useRegistryAdoptionRepositoriesQuery: () => ({
      isPending: false,
      error: null,
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
  }),
);

describe("RegistryAdoptionPage", () => {
  it("renders heading, back link, and adoption table", () => {
    const html = renderToStaticMarkup(<RegistryAdoptionPage />);
    expect(html).toContain("Registry Adoption");
    expect(html).toContain('href="/"');
    expect(html).toContain("repo-1");
  });
});
