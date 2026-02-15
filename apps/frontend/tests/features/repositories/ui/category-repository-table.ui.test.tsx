import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CategoryRepositoryTable,
  sortByRepositoryName,
} from "../../../../src/features/repositories/ui/components/CategoryRepositoryTable";
import type { CategoryRepositoryView } from "../../../../src/features/repositories/model/types";

const repositories: readonly CategoryRepositoryView[] = [
  {
    owner: { login: "octo", type: "User" },
    name: "beta",
    github: {
      openIssues: null,
      lastCommitToDefaultBranchAt: null,
      defaultBranch: null,
      dataStatus: "rate_limited",
      errorMessage: "rate limited",
    },
    registry: null,
    links: {
      repo: "https://github.com/octo/beta",
    },
  },
  {
    owner: { login: "acme", type: "Organization" },
    name: "alpha",
    github: {
      openIssues: 12,
      lastCommitToDefaultBranchAt: "2026-02-10T00:00:00.000Z",
      defaultBranch: "main",
      dataStatus: "ok",
      errorMessage: null,
    },
    registry: null,
    links: {
      repo: "https://github.com/acme/alpha",
    },
  },
];

describe("CategoryRepositoryTable", () => {
  it("sorts repositories by owner/name ascending", () => {
    const sorted = sortByRepositoryName(repositories);

    expect(sorted[0]?.name).toBe("alpha");
    expect(sorted[1]?.name).toBe("beta");
  });

  it("renders nullable fields as N/A", () => {
    const html = renderToStaticMarkup(
      <CategoryRepositoryTable repositories={repositories} />,
    );

    expect(html).toContain("Open Issues");
    expect(html).toContain("Registry");
    expect(html).toContain("N/A");
  });

  it("renders repository as a GitHub link", () => {
    const html = renderToStaticMarkup(
      <CategoryRepositoryTable repositories={repositories} />,
    );

    expect(html).toContain('href="https://github.com/acme/alpha"');
    expect(html).toContain("Org");
    expect(html).toContain("rate limited");
  });
});
