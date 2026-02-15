import type {
  CategoryDetail,
  CategorySummary,
  RegisterRepositoryInput,
  RefreshRepositoryResponse,
  RepositoryView,
} from "../model/types";

export interface RepositoryApiPort {
  listCategories(): Promise<readonly CategorySummary[]>;
  getCategoryDetail(slug: string): Promise<CategoryDetail>;
  listRepositories(): Promise<readonly RepositoryView[]>;
  registerRepository(input: RegisterRepositoryInput): Promise<RepositoryView>;
  refreshRepository(
    repositoryId: string,
  ): Promise<RefreshRepositoryResponse["data"]>;
}
