import type {
  RepositoryPort,
  CreateRepositoryInput,
} from "../../application/ports/repository-port";
import type { Repository, RepositoryId } from "../../domain/models/repository";
import { asc, count, eq } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "../db/drizzle/client";
import { repositoriesTable } from "../db/drizzle/schema";

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

export class DrizzleRepositoryAdapter implements RepositoryPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async create(input: CreateRepositoryInput): Promise<Repository> {
    const now = new Date();
    const id = crypto.randomUUID();

    await this.db.db.insert(repositoriesTable).values({
      id,
      url: input.url,
      owner: input.owner,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });

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
