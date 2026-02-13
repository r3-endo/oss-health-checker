import type { CategoryReadPort } from "../ports/category-read-port.js";
import type { CategorySummary } from "../read-models/category-summary.js";

export interface ListCategorySummariesUseCase {
  execute(): Promise<readonly CategorySummary[]>;
}

export class ListCategorySummariesService implements ListCategorySummariesUseCase {
  constructor(private readonly categoryReadPort: CategoryReadPort) {}

  async execute(): Promise<readonly CategorySummary[]> {
    return this.categoryReadPort.listSummaries();
  }
}
