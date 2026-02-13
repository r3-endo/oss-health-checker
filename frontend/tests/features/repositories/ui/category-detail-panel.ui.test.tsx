import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryDetailPanel } from "../../../../src/features/repositories/ui/components/CategoryDetailPanel";

describe("CategoryDetailPanel", () => {
  it("shows loading skeleton while fetching category detail", () => {
    const html = renderToStaticMarkup(
      <CategoryDetailPanel
        isPending
        errorMessage={undefined}
        isFetching={false}
        updatedAt={null}
        repositories={null}
      />,
    );

    expect(html).toContain("Open Issues");
    expect(html).toContain("Open PRs");
  });

  it("shows error message when detail request fails", () => {
    const html = renderToStaticMarkup(
      <CategoryDetailPanel
        isPending={false}
        errorMessage="not found"
        isFetching={false}
        updatedAt={null}
        repositories={null}
      />,
    );

    expect(html).toContain("not found");
  });

  it("shows updating state and updated-at label", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-13T00:05:00.000Z"));

    const html = renderToStaticMarkup(
      <CategoryDetailPanel
        isPending={false}
        errorMessage={undefined}
        isFetching
        updatedAt="2026-02-13T00:00:00.000Z"
        repositories={[
          {
            owner: { login: "octo", type: "User" },
            name: "repo",
            github: {
              stars: 1,
              openIssues: 2,
              openPRs: 3,
              lastCommitToDefaultBranchAt: "2026-02-10T00:00:00.000Z",
              defaultBranch: "main",
              dataStatus: "ok",
              errorMessage: null,
            },
            links: {
              repo: "https://github.com/octo/repo",
            },
          },
        ]}
      />,
    );

    expect(html).toContain("Updating category data");
    expect(html).toContain("Updated 5 min ago");
    expect(html).toContain("repo");

    vi.useRealTimers();
  });
});
