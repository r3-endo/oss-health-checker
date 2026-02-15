import { describe, expect, it } from "vitest";
import { ApplicationError } from "@oss-health-checker/common/features/development-health/application/errors/application-error.js";
import type { CategoryReadPort } from "@backend/src/features/development-health/application/ports/category-read-port.js";
import type { RegistryDataPort } from "@backend/src/features/development-health/application/ports/registry-data-port.js";
import type { RepositorySnapshotReadPort } from "@backend/src/features/development-health/application/ports/repository-snapshot-read-port.js";
import { GetCategoryDetailService } from "@backend/src/features/development-health/application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "@backend/src/features/development-health/application/use-cases/list-category-summaries-use-case.js";

const stubRegistryDataPort: RegistryDataPort = {
  findLatestByRepositoryId: async () => null,
};

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

  it("builds category detail from persisted snapshots", async () => {
    const categoryReadPort: CategoryReadPort = {
      listSummaries: async () => [],
      findSummaryBySlug: async () => ({
        slug: "llm",
        name: "Large Language Models",
        displayOrder: 1,
      }),
      listRepositoriesByCategorySlug: async () => [
        { repositoryId: "r1", owner: "octocat", name: "stable-repo" },
        { repositoryId: "r2", owner: "acme", name: "platform" },
      ],
    };

    const repositorySnapshotReadPort: RepositorySnapshotReadPort = {
      findLatestByRepositoryIds: async () =>
        new Map([
          [
            "r1",
            {
              repositoryId: "r1",
              recordedAt: "2026-02-12T00:00:00.000Z",
              openIssues: 8,
              commitCount30d: 42,
              contributorCount: 4,
              lastCommitAt: "2026-02-01T00:00:00.000Z",
              lastReleaseAt: null,
              healthScoreVersion: 1,
            },
          ],
        ]),
      findOpenIssuesAtOrBefore: async () => null,
    };

    const useCase = new GetCategoryDetailService(
      categoryReadPort,
      repositorySnapshotReadPort,
      stubRegistryDataPort,
      () => new Date("2026-02-13T01:00:00.000Z"),
    );

    const result = await useCase.execute({ slug: "llm" });

    expect(result.slug).toBe("llm");
    expect(result.updatedAt).toBe("2026-02-12T00:00:00.000Z");
    expect(result.repositories).toHaveLength(2);
    expect(result.repositories[0]).toEqual({
      owner: { login: "acme", type: "User" },
      name: "platform",
      github: {
        openIssues: null,
        lastCommitToDefaultBranchAt: null,
        defaultBranch: null,
        dataStatus: "pending",
        errorMessage: "Snapshot not collected yet",
      },
      registry: null,
      links: {
        repo: "https://github.com/acme/platform",
      },
    });
    expect(result.repositories[1]?.github.openIssues).toBe(8);
  });

  it("throws NOT_FOUND when category slug does not exist", async () => {
    const categoryReadPort: CategoryReadPort = {
      listSummaries: async () => [],
      findSummaryBySlug: async () => null,
      listRepositoriesByCategorySlug: async () => [],
    };
    const repositorySnapshotReadPort: RepositorySnapshotReadPort = {
      findLatestByRepositoryIds: async () => new Map(),
      findOpenIssuesAtOrBefore: async () => null,
    };

    const useCase = new GetCategoryDetailService(
      categoryReadPort,
      repositorySnapshotReadPort,
      stubRegistryDataPort,
    );

    await expect(useCase.execute({ slug: "unknown" })).rejects.toEqual(
      new ApplicationError("NOT_FOUND", "Category not found"),
    );
  });
});
