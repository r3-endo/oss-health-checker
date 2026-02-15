import type { CategorySummary } from "../read-models/category-summary.js";

export type CategoryRepositoryRef = Readonly<{
  repositoryId: string;
  owner: string;
  name: string;
}>;

export interface CategoryReadPort {
  listSummaries(): Promise<readonly CategorySummary[]>;
  findSummaryBySlug(slug: string): Promise<CategorySummary | null>;
  listRepositoriesByCategorySlug(
    slug: string,
  ): Promise<readonly CategoryRepositoryRef[]>;
}
