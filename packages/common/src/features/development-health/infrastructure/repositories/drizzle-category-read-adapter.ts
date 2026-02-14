import { asc, eq } from "drizzle-orm";
import type { CategoryReadPort } from "../../application/ports/category-read-port.js";
import type { CategorySummary } from "../../application/read-models/category-summary.js";
import type { DrizzleDatabaseHandle } from "../../../../shared/infrastructure/db/drizzle/client.js";
import {
  categoriesTable,
  repositoriesTable,
  repositoryCategoriesTable,
} from "../../../../shared/infrastructure/db/drizzle/schema.js";

const mapSummary = (
  row: typeof categoriesTable.$inferSelect,
): CategorySummary =>
  Object.freeze({
    slug: row.slug,
    name: row.name,
    displayOrder: row.displayOrder,
  });

export class DrizzleCategoryReadAdapter implements CategoryReadPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async listSummaries(): Promise<readonly CategorySummary[]> {
    const rows = await this.db.db
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.displayOrder), asc(categoriesTable.slug));

    return rows.map(mapSummary);
  }

  async findSummaryBySlug(slug: string): Promise<CategorySummary | null> {
    const [row] = await this.db.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, slug))
      .limit(1);

    return row ? mapSummary(row) : null;
  }

  async listRepositoriesByCategorySlug(
    slug: string,
  ): Promise<readonly { repositoryId: string; owner: string; name: string }[]> {
    const rows = await this.db.db
      .select({
        repositoryId: repositoriesTable.id,
        owner: repositoriesTable.owner,
        name: repositoriesTable.name,
      })
      .from(repositoryCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(repositoryCategoriesTable.categoryId, categoriesTable.id),
      )
      .innerJoin(
        repositoriesTable,
        eq(repositoryCategoriesTable.repositoryId, repositoriesTable.id),
      )
      .where(eq(categoriesTable.slug, slug))
      .orderBy(asc(repositoriesTable.owner), asc(repositoriesTable.name));

    return rows;
  }
}
