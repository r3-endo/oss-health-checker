import type { Repository, RepositoryId } from "../../domain/models/repository";

export type CreateRepositoryInput = Readonly<{
  url: string;
  owner: string;
  name: string;
}>;

export interface RepositoryPort {
  create(input: CreateRepositoryInput): Promise<Repository>;
  list(): Promise<readonly Repository[]>;
  findById(id: RepositoryId): Promise<Repository | null>;
  count(): Promise<number>;
}
