export type RepositoryOwner = Readonly<{
  login: string;
  type: "Organization" | "User";
}>;

export type CategoryRepositoryDataStatus =
  | "ok"
  | "pending"
  | "rate_limited"
  | "error";

export type CategoryRepositoryFacts = Readonly<{
  owner: RepositoryOwner;
  openIssues: number | null;
  lastCommitToDefaultBranchAt: string | null;
  defaultBranch: string | null;
  dataStatus: CategoryRepositoryDataStatus;
  errorMessage: string | null;
}>;

export interface CategoryRepositoryFactsPort {
  fetchCategoryRepositoryFacts(
    owner: string,
    name: string,
  ): Promise<CategoryRepositoryFacts>;
}
