import { eq } from "drizzle-orm";
import type { RepositoryPackageMappingPort } from "../../application/ports/repository-package-mapping-port.js";
import type { RepositoryPackageMapping } from "../../domain/models/adoption.js";
import type { DrizzleDatabaseHandle } from "../../../../shared/infrastructure/db/drizzle/client.js";
import { repositoryPackageMappingsTable } from "../../../../shared/infrastructure/db/drizzle/schema.js";
import { parsePersistedRegistrySource } from "./persisted-adoption-validation.js";

const mapRow = (
  row: typeof repositoryPackageMappingsTable.$inferSelect,
): RepositoryPackageMapping =>
  Object.freeze({
    repositoryId: row.repositoryId,
    source: parsePersistedRegistrySource(row.source),
    packageName: row.packageName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export class DrizzleRepositoryPackageMappingAdapter implements RepositoryPackageMappingPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async findByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryPackageMapping | null> {
    const row = this.db.db
      .select()
      .from(repositoryPackageMappingsTable)
      .where(eq(repositoryPackageMappingsTable.repositoryId, repositoryId))
      .get();

    return row ? mapRow(row) : null;
  }

  async upsert(input: {
    repositoryId: string;
    source: RepositoryPackageMapping["source"];
    packageName: string;
    now: Date;
  }): Promise<RepositoryPackageMapping> {
    this.db.db
      .insert(repositoryPackageMappingsTable)
      .values({
        repositoryId: input.repositoryId,
        source: input.source,
        packageName: input.packageName,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: repositoryPackageMappingsTable.repositoryId,
        set: {
          source: input.source,
          packageName: input.packageName,
          updatedAt: input.now,
        },
      })
      .run();

    const row = this.db.db
      .select()
      .from(repositoryPackageMappingsTable)
      .where(
        eq(repositoryPackageMappingsTable.repositoryId, input.repositoryId),
      )
      .get();

    if (!row) {
      throw new Error("Failed to read upserted repository package mapping");
    }

    return mapRow(row);
  }
}
