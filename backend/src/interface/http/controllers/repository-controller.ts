import type { ListRepositoriesWithLatestSnapshotUseCase } from "../../../application/use-cases/list-repositories-with-latest-snapshot-use-case";
import type { RefreshRepositoryInput } from "../../../application/use-cases/refresh-repository-use-case";
import type { RefreshRepositoryUseCase } from "../../../application/use-cases/refresh-repository-use-case";
import type { RegisterRepositoryInput } from "../../../application/use-cases/register-repository-use-case";
import type { RegisterRepositoryUseCase } from "../../../application/use-cases/register-repository-use-case";

export class RepositoryController {
  constructor(
    private readonly listRepositoriesWithLatestSnapshotUseCase: ListRepositoriesWithLatestSnapshotUseCase,
    private readonly registerRepositoryUseCase: RegisterRepositoryUseCase,
    private readonly refreshRepositoryUseCase: RefreshRepositoryUseCase,
  ) {}

  list = async (): Promise<
    Readonly<{
      data: Awaited<
        ReturnType<ListRepositoriesWithLatestSnapshotUseCase["execute"]>
      >;
    }>
  > => {
    const data = await this.listRepositoriesWithLatestSnapshotUseCase.execute();
    return { data };
  };

  create = async (
    input: RegisterRepositoryInput,
  ): Promise<
    Readonly<{
      data: Awaited<ReturnType<RegisterRepositoryUseCase["execute"]>>;
    }>
  > => {
    const data = await this.registerRepositoryUseCase.execute(input);
    return { data };
  };

  refresh = async (
    input: RefreshRepositoryInput,
  ): Promise<
    Readonly<{
      data: Awaited<ReturnType<RefreshRepositoryUseCase["execute"]>>;
    }>
  > => {
    const data = await this.refreshRepositoryUseCase.execute(input);
    return { data };
  };
}
