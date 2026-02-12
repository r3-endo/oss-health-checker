import {
  RepositoryAlreadyExistsError,
  RepositoryLimitExceededError,
  type RepositoryPort,
  type CreateRepositoryInput,
} from "../../application/ports/repository-port.js";
import type {
  Repository,
  RepositoryId,
} from "../../domain/models/repository.js";
import { asc, count, eq } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "../db/drizzle/client.js";
import { repositoriesTable } from "../db/drizzle/schema.js";

const mapRepository = (
  row: typeof repositoriesTable.$inferSelect,
): Repository =>
  Object.freeze({
    id: row.id,
    url: row.url,
    owner: row.owner,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Error &&
  /UNIQUE constraint failed: repositories\.url/.test(error.message);

export class DrizzleRepositoryAdapter implements RepositoryPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async create(input: CreateRepositoryInput): Promise<Repository> {
    const now = new Date();
    const id = crypto.randomUUID();

    try {
      await this.db.db.insert(repositoriesTable).values({
        id,
        url: input.url,
        owner: input.owner,
        name: input.name,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new RepositoryAlreadyExistsError();
      }
      throw error;
    }

    return Object.freeze({
      id,
      url: input.url,
      owner: input.owner,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  async createWithLimit(
    input: CreateRepositoryInput,
    limit: number,
  ): Promise<Repository> {
    const now = new Date();
    const id = crypto.randomUUID();

    try {
      this.db.db.transaction((tx) => {
        const [row] = tx
          .select({ value: count() })
          .from(repositoriesTable)
          .all();
        const repositoryCount = row?.value ?? 0;
        if (repositoryCount >= limit) {
          throw new RepositoryLimitExceededError(limit);
        }

        tx.insert(repositoriesTable)
          .values({
            id,
            url: input.url,
            owner: input.owner,
            name: input.name,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      });
    } catch (error) {
      if (error instanceof RepositoryLimitExceededError) {
        throw error;
      }
      if (isUniqueConstraintError(error)) {
        throw new RepositoryAlreadyExistsError();
      }
      throw error;
    }

    return Object.freeze({
      id,
      url: input.url,
      owner: input.owner,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  async list(): Promise<readonly Repository[]> {
    const rows = await this.db.db
      .select()
      .from(repositoriesTable)
      .orderBy(asc(repositoriesTable.createdAt));

    return rows.map(mapRepository);
  }

  async findById(id: RepositoryId): Promise<Repository | null> {
    const [row] = await this.db.db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.id, id))
      .limit(1);

    return row ? mapRepository(row) : null;
  }

  async count(): Promise<number> {
    const [row] = await this.db.db
      .select({ value: count() })
      .from(repositoriesTable);

    return row?.value ?? 0;
  }
}
