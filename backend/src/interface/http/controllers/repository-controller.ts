import type { Context } from "hono";
import type { ListRepositoriesWithLatestSnapshotUseCase } from "../../../application/use-cases/list-repositories-with-latest-snapshot-use-case";
import { mapErrorToHttp } from "../error-mapper";

export class RepositoryController {
  constructor(
    private readonly listRepositoriesWithLatestSnapshotUseCase: ListRepositoriesWithLatestSnapshotUseCase,
  ) {}

  list = async (c: Context): Promise<Response> => {
    try {
      const data =
        await this.listRepositoriesWithLatestSnapshotUseCase.execute();
      return c.json({ data });
    } catch (error) {
      return mapErrorToHttp(c, error);
    }
  };
}
