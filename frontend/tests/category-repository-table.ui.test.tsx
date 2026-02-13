import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CategoryRepositoryTable,
  sortByHealthScoreDesc,
} from "../src/features/repositories/ui/components/CategoryRepositoryTable";
import type { CategoryRepositoryView } from "../src/features/repositories/model/types";

const repositories: readonly CategoryRepositoryView[] = [
  {
    owner: "octo",
    name: "beta",
    lastCommit: null,
    metrics: {
      devHealth: {
        healthScore: 42,
        status: "Stale",
        scoreVersion: 1,
        issueGrowth30d: null,
        commitLast30d: null,
      },
      adoption: null,
      security: null,
      governance: null,
    },
  },
  {
    owner: "octo",
    name: "alpha",
    lastCommit: "2026-02-10T00:00:00.000Z",
    metrics: {
      devHealth: {
        healthScore: 88,
        status: "Active",
        scoreVersion: 1,
        issueGrowth30d: 12,
        commitLast30d: 34,
      },
      adoption: null,
      security: null,
      governance: null,
    },
  },
];

describe("CategoryRepositoryTable", () => {
  it("sorts repositories by health score descending", () => {
    const sorted = sortByHealthScoreDesc(repositories);

    expect(sorted[0]?.name).toBe("alpha");
    expect(sorted[1]?.name).toBe("beta");
  });

  it("renders nullable fields as N/A", () => {
    const html = renderToStaticMarkup(
      <CategoryRepositoryTable repositories={repositories} />,
    );

    expect(html).toContain("Issue Delta 30d");
    expect(html).toContain("Commits 30d");
    expect(html).toContain("N/A");
  });

  it("renders repository name as a GitHub link", () => {
    const html = renderToStaticMarkup(
      <CategoryRepositoryTable repositories={repositories} />,
    );

    expect(html).toContain('href="https://github.com/octo/alpha"');
  });
});
