import type {
  RepositoryPort,
  CreateRepositoryInput,
} from "../../application/ports/repository-port";
import type { Repository, RepositoryId } from "../../domain/models/repository";
import type { DrizzleDatabaseHandle } from "../db/drizzle/client";

export class DrizzleRepositoryAdapter implements RepositoryPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async create(_input: CreateRepositoryInput): Promise<Repository> {
    void _input;
    throw new Error(`Not implemented: create repository via ${this.db.kind}`);
  }

  async list(): Promise<readonly Repository[]> {
    throw new Error(`Not implemented: list repositories via ${this.db.kind}`);
  }

  async findById(_id: RepositoryId): Promise<Repository | null> {
    void _id;
    throw new Error(`Not implemented: find repository via ${this.db.kind}`);
  }

  async count(): Promise<number> {
    throw new Error(`Not implemented: count repositories via ${this.db.kind}`);
  }
}
