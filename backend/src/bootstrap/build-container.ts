import { ListRepositoriesWithLatestSnapshotService } from "../application/use-cases/list-repositories-with-latest-snapshot-use-case";
import type { AppEnv } from "../infrastructure/config/env";
import { createDrizzleHandle } from "../infrastructure/db/drizzle/client";
import { DrizzleRepositoryReadModelAdapter } from "../infrastructure/repositories/drizzle-repository-read-model-adapter";
import { RepositoryController } from "../interface/http/controllers/repository-controller";

export type AppContainer = Readonly<{
  repositoryController: RepositoryController;
}>;

export const buildContainer = (appEnv: AppEnv): AppContainer => {
  const db = createDrizzleHandle(appEnv);

  const repositoryReadModelAdapter = new DrizzleRepositoryReadModelAdapter(db);

  const listRepositoriesWithLatestSnapshotUseCase =
    new ListRepositoriesWithLatestSnapshotService(repositoryReadModelAdapter);

  const repositoryController = new RepositoryController(
    listRepositoriesWithLatestSnapshotUseCase,
  );

  return Object.freeze({
    repositoryController,
  });
};
