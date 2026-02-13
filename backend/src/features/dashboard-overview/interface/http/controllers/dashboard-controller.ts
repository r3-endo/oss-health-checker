import type { ListDashboardRepositoriesUseCase } from "../../../application/use-cases/list-dashboard-repositories-use-case.js";

export class DashboardController {
  constructor(
    private readonly listDashboardRepositoriesUseCase: ListDashboardRepositoriesUseCase,
  ) {}

  listRepositories = async (): Promise<{
    data: Awaited<ReturnType<ListDashboardRepositoriesUseCase["execute"]>>;
  }> => {
    const data = await this.listDashboardRepositoriesUseCase.execute();
    return { data };
  };
}
