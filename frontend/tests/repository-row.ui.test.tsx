import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RepositoryRowView } from "../src/features/repositories/ui/components/RepositoryRow";

describe("RepositoryRowView", () => {
  it("shows refresh failure feedback while keeping previous snapshot values", () => {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <RepositoryRowView
            repository={{
              id: "repo-1",
              url: "https://github.com/octocat/Hello-World",
              owner: "octocat",
              name: "Hello-World",
              status: "Stale",
              warningReasons: ["commit_stale"],
              lastCommitAt: "2025-01-10T00:00:00.000Z",
              lastReleaseAt: "2024-01-10T00:00:00.000Z",
              openIssuesCount: 42,
              contributorsCount: 9,
              fetchedAt: "2026-02-10T00:00:00.000Z",
            }}
            isRefreshing={false}
            refreshErrorMessage="rate limited"
            onRefresh={() => undefined}
          />
        </tbody>
      </table>,
    );

    expect(html).toContain("Hello-World");
    expect(html).toContain("octocat");
    expect(html).toContain("2025-01-10");
    expect(html).toContain("2024-01-10");
    expect(html).toContain("42");
    expect(html).toContain("9");
    expect(html).toContain("rate limited");
  });
});
