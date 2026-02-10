import type { RegisterRepositoryInput, RepositoryView } from "../model/types";

export interface RepositoryApiPort {
  listRepositories(): Promise<readonly RepositoryView[]>;
  registerRepository(input: RegisterRepositoryInput): Promise<RepositoryView>;
  refreshRepository(repositoryId: string): Promise<RepositoryView>;
}
