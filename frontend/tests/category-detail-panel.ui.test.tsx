import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RepositoryApiError } from "../src/features/repositories/api/repository-api-adapter";
import { CategoryDetailPanel } from "../src/features/repositories/ui/components/CategoryDetailPanel";

describe("CategoryDetailPanel", () => {
  it("shows loading skeleton while fetching category detail", () => {
    const html = renderToStaticMarkup(
      <CategoryDetailPanel
        isPending
        isError={false}
        error={null}
        isFetching={false}
        repositories={null}
      />,
    );

    expect(html).toContain("Issue Delta 30d");
    expect(html).toContain("Commits 30d");
  });

  it("shows API error message when detail request fails", () => {
    const html = renderToStaticMarkup(
      <CategoryDetailPanel
        isPending={false}
        isError
        error={new RepositoryApiError(404, "CATEGORY_NOT_FOUND", "not found")}
        isFetching={false}
        repositories={null}
      />,
    );

    expect(html).toContain("not found");
  });

  it("shows updating state while background refetch is running", () => {
    const html = renderToStaticMarkup(
      <CategoryDetailPanel
        isPending={false}
        isError={false}
        error={null}
        isFetching
        repositories={[
          {
            owner: "octo",
            name: "repo",
            lastCommit: "2026-02-10T00:00:00.000Z",
            metrics: {
              devHealth: {
                healthScore: 80,
                status: "Active",
                scoreVersion: 1,
                issueGrowth30d: 3,
                commitLast30d: 10,
              },
              adoption: null,
              security: null,
              governance: null,
            },
          },
        ]}
      />,
    );

    expect(html).toContain("Updating category data");
    expect(html).toContain("repo");
  });
});
