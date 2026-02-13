import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RepositoriesPage } from "../../../../src/features/repositories/ui/pages/RepositoriesPage";

vi.mock(
  "../../../../src/features/repositories/hooks/use-repositories-page-data",
  () => ({
    useRepositoriesPageData: () => ({
      categories: [
        { slug: "llm", name: "LLM", displayOrder: 0 },
        { slug: "backend", name: "Backend", displayOrder: 1 },
        { slug: "frontend", name: "Frontend", displayOrder: 2 },
      ],
      selectedSlug: "llm",
      setSelectedSlug: () => undefined,
      categoriesQuery: { isPending: false, errorMessage: null },
      detailQuery: {
        isPending: false,
        errorMessage: null,
        isFetching: false,
        data: {
          updatedAt: "2026-02-13T00:00:00.000Z",
          repositories: [],
        },
      },
    }),
  }),
);

describe("RepositoriesPage", () => {
  it("renders GitHub Health header and keeps category tabs", () => {
    const html = renderToStaticMarkup(<RepositoriesPage />);
    expect(html).toContain("GitHub Health");
    expect(html).toContain("LLM");
    expect(html).toContain("Backend");
    expect(html).toContain("Frontend");
    expect(html).toContain('href="/"');
  });
});
