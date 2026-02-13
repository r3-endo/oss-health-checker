import type { GetCategoryDetailUseCase } from "../../../application/use-cases/get-category-detail-use-case.js";
import type { ListCategorySummariesUseCase } from "../../../application/use-cases/list-category-summaries-use-case.js";

export class CategoryController {
  constructor(
    private readonly listCategorySummariesUseCase: ListCategorySummariesUseCase,
    private readonly getCategoryDetailUseCase: GetCategoryDetailUseCase,
  ) {}

  listCategories = async (): Promise<{
    data: Awaited<ReturnType<ListCategorySummariesUseCase["execute"]>>;
  }> => {
    const data = await this.listCategorySummariesUseCase.execute();
    return { data };
  };

  getCategoryDetail = async (params: {
    slug: string;
  }): Promise<{ data: Awaited<ReturnType<GetCategoryDetailUseCase["execute"]>> }> => {
    const data = await this.getCategoryDetailUseCase.execute(params);
    return { data };
  };
}
