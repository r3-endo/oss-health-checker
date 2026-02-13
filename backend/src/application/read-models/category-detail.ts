import type {
  CategoryRepositoryDataStatus,
  RepositoryOwner,
} from "../ports/category-repository-facts-port.js";

export type CategoryRepositoryView = Readonly<{
  owner: RepositoryOwner;
  name: string;
  github: Readonly<{
    stars: number | null;
    openIssues: number | null;
    openPRs: number | null;
    lastCommitToDefaultBranchAt: string | null;
    defaultBranch: string | null;
    dataStatus: CategoryRepositoryDataStatus;
    errorMessage: string | null;
  }>;
  links: Readonly<{
    repo: string;
  }>;
}>;

export type CategoryDetail = Readonly<{
  slug: string;
  name: string;
  updatedAt: string;
  repositories: readonly CategoryRepositoryView[];
}>;
