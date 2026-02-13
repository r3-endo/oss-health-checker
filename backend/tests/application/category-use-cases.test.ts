import { describe, expect, it } from "vitest";
import { ApplicationError } from "../../src/application/errors/application-error.js";
import type { CategoryReadPort } from "../../src/application/ports/category-read-port.js";
import type { RepositorySnapshotReadPort } from "../../src/application/ports/repository-snapshot-read-port.js";
import { GetCategoryDetailService } from "../../src/application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "../../src/application/use-cases/list-category-summaries-use-case.js";

describe("category use-cases", () => {
  it("lists category summaries from category read port", async () => {
    const categoryReadPort: CategoryReadPort = {
      listSummaries: async () => [
        { slug: "llm", name: "Large Language Models", displayOrder: 1 },
      ],
      findSummaryBySlug: async () => null,
      listRepositoriesByCategorySlug: async () => [],
    };

    const useCase = new ListCategorySummariesService(categoryReadPort);
    await expect(useCase.execute()).resolves.toEqual([
      { slug: "llm", name: "Large Language Models", displayOrder: 1 },
    ]);
  });

  it("builds category detail metrics and sorts repositories by health score descending", async () => {
    const categoryReadPort: CategoryReadPort = {
      listSummaries: async () => [],
      findSummaryBySlug: async () => ({
        slug: "llm",
        name: "Large Language Models",
        displayOrder: 1,
      }),
      listRepositoriesByCategorySlug: async () => [
        { repositoryId: "r1", owner: "octocat", name: "stable-repo" },
        { repositoryId: "r2", owner: "octocat", name: "stale-repo" },
      ],
    };

    const snapshotReadPort: RepositorySnapshotReadPort = {
      findLatestByRepositoryIds: async () =>
        new Map([
          [
            "r1",
            {
              repositoryId: "r1",
              recordedAt: "2026-02-01T00:00:00.000Z",
              openIssues: 5,
              commitCount30d: 40,
              contributorCount: 8,
              lastCommitAt: "2026-01-30T00:00:00.000Z",
              lastReleaseAt: "2026-01-15T00:00:00.000Z",
              healthScoreVersion: 1,
            },
          ],
          [
            "r2",
            {
              repositoryId: "r2",
              recordedAt: "2026-02-01T00:00:00.000Z",
              openIssues: 220,
              commitCount30d: null,
              contributorCount: 1,
              lastCommitAt: "2025-01-01T00:00:00.000Z",
              lastReleaseAt: null,
              healthScoreVersion: 1,
            },
          ],
        ]),
      findOpenIssuesAtOrBefore: async (repositoryId: string) =>
        repositoryId === "r1" ? 2 : null,
    };

    const useCase = new GetCategoryDetailService(
      categoryReadPort,
      snapshotReadPort,
    );

    const result = await useCase.execute({ slug: "llm" });

    expect(result.slug).toBe("llm");
    expect(result.repositories).toHaveLength(2);
    expect(result.repositories[0]?.name).toBe("stable-repo");
    expect(result.repositories[1]?.name).toBe("stale-repo");
    expect(result.repositories[0]?.metrics.devHealth.issueGrowth30d).toBe(3);
    expect(result.repositories[1]?.metrics.devHealth.issueGrowth30d).toBeNull();
    expect(result.repositories[0]?.metrics.adoption).toBeNull();
    expect(result.repositories[0]?.metrics.security).toBeNull();
    expect(result.repositories[0]?.metrics.governance).toBeNull();
  });

  it("throws NOT_FOUND when category slug does not exist", async () => {
    const categoryReadPort: CategoryReadPort = {
      listSummaries: async () => [],
      findSummaryBySlug: async () => null,
      listRepositoriesByCategorySlug: async () => [],
    };
    const snapshotReadPort: RepositorySnapshotReadPort = {
      findLatestByRepositoryIds: async () => new Map(),
      findOpenIssuesAtOrBefore: async () => null,
    };

    const useCase = new GetCategoryDetailService(
      categoryReadPort,
      snapshotReadPort,
    );

    await expect(useCase.execute({ slug: "unknown" })).rejects.toEqual(
      new ApplicationError("NOT_FOUND", "Category not found"),
    );
  });
});
