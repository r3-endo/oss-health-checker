import type {
  Repository,
  RepositoryId,
} from "../../domain/models/repository.js";

export type CreateRepositoryInput = Readonly<{
  url: string;
  owner: string;
  name: string;
}>;

export class RepositoryLimitExceededError extends Error {
  constructor(public readonly limit: number) {
    super(`Repository limit reached (max ${limit})`);
    this.name = "RepositoryLimitExceededError";
  }
}

export class RepositoryAlreadyExistsError extends Error {
  constructor(message = "Repository already exists") {
    super(message);
    this.name = "RepositoryAlreadyExistsError";
  }
}

export interface RepositoryPort {
  create(input: CreateRepositoryInput): Promise<Repository>;
  createWithLimit(
    input: CreateRepositoryInput,
    limit: number,
  ): Promise<Repository>;
  list(): Promise<readonly Repository[]>;
  findById(id: RepositoryId): Promise<Repository | null>;
  count(): Promise<number>;
}
