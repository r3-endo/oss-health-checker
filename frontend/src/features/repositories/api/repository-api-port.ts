import type {
  RegisterRepositoryInput,
  RefreshRepositoryResponse,
  RepositoryView,
} from "../model/types";

export interface RepositoryApiPort {
  listRepositories(): Promise<readonly RepositoryView[]>;
  registerRepository(input: RegisterRepositoryInput): Promise<RepositoryView>;
  refreshRepository(
    repositoryId: string,
  ): Promise<RefreshRepositoryResponse["data"]>;
}
