import { describe, expect, it } from "vitest";
import { ApplicationError } from "../../src/application/errors/application-error.js";
import type { CategoryReadPort } from "../../src/application/ports/category-read-port.js";
import type { CategoryRepositoryFactsPort } from "../../src/application/ports/category-repository-facts-port.js";
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

  it("builds category detail from GitHub facts with separated issue/pr counts", async () => {
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

    const categoryRepositoryFactsPort: CategoryRepositoryFactsPort = {
      fetchCategoryRepositoryFacts: async (owner) =>
        owner === "octocat"
          ? {
              owner: { login: "octocat", type: "User" },
              stars: 100,
              openIssues: 8,
              openPRs: 2,
              defaultBranch: "main",
              lastCommitToDefaultBranchAt: "2026-02-01T00:00:00.000Z",
              dataStatus: "ok",
              errorMessage: null,
            }
          : {
              owner: { login: "acme", type: "Organization" },
              stars: null,
              openIssues: null,
              openPRs: null,
              defaultBranch: null,
              lastCommitToDefaultBranchAt: null,
              dataStatus: "rate_limited",
              errorMessage: "GitHub API rate limit exceeded",
            },
    };

    const useCase = new GetCategoryDetailService(
      categoryReadPort,
      categoryRepositoryFactsPort,
      () => new Date("2026-02-13T01:00:00.000Z"),
    );

    const result = await useCase.execute({ slug: "llm" });

    expect(result.slug).toBe("llm");
    expect(result.updatedAt).toBe("2026-02-13T01:00:00.000Z");
    expect(result.repositories).toHaveLength(2);
    expect(result.repositories[0]).toEqual({
      owner: { login: "acme", type: "Organization" },
      name: "platform",
      github: {
        stars: null,
        openIssues: null,
        openPRs: null,
        lastCommitToDefaultBranchAt: null,
        defaultBranch: null,
        dataStatus: "rate_limited",
        errorMessage: "GitHub API rate limit exceeded",
      },
      links: {
        repo: "https://github.com/acme/platform",
      },
    });
    expect(result.repositories[1]?.github.openIssues).toBe(8);
    expect(result.repositories[1]?.github.openPRs).toBe(2);
  });

  it("throws NOT_FOUND when category slug does not exist", async () => {
    const categoryReadPort: CategoryReadPort = {
      listSummaries: async () => [],
      findSummaryBySlug: async () => null,
      listRepositoriesByCategorySlug: async () => [],
    };
    const categoryRepositoryFactsPort: CategoryRepositoryFactsPort = {
      fetchCategoryRepositoryFacts: async () => ({
        owner: { login: "octo", type: "User" },
        stars: 0,
        openIssues: 0,
        openPRs: 0,
        defaultBranch: "main",
        lastCommitToDefaultBranchAt: "2026-02-01T00:00:00.000Z",
        dataStatus: "ok",
        errorMessage: null,
      }),
    };

    const useCase = new GetCategoryDetailService(
      categoryReadPort,
      categoryRepositoryFactsPort,
    );

    await expect(useCase.execute({ slug: "unknown" })).rejects.toEqual(
      new ApplicationError("NOT_FOUND", "Category not found"),
    );
  });
});
