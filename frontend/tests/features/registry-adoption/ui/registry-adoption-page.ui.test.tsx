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
            mappingStatus: "mapped",
            adoptionFetchStatus: "succeeded",
            source: "npm",
            packageName: "pkg-1",
            weeklyDownloads: 123,
            downloadsDelta7d: 3,
            downloadsDelta30d: 10,
            lastPublishedAt: "2026-02-11T00:00:00.000Z",
            latestVersion: "1.0.0",
            fetchedAt: "2026-02-12T00:00:00.000Z",
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
    expect(html).toContain("Updated every morning");
    expect(html).toContain("Latest adoption snapshot: 2026-02-12");
  });
});
