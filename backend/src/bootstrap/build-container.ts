import { ListRepositoriesWithLatestSnapshotService } from "../application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { RefreshRepositoryService } from "../application/use-cases/refresh-repository-use-case.js";
import { RegisterRepositoryService } from "../application/use-cases/register-repository-use-case.js";
import type { AppEnv } from "../infrastructure/config/env.js";
import { createDrizzleHandle } from "../infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../infrastructure/db/drizzle/migrate.js";
import { GitHubRestRepositoryGateway } from "../infrastructure/gateways/github-rest-repository-gateway.js";
import { DrizzleRepositoryAdapter } from "../infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleRepositoryReadModelAdapter } from "../infrastructure/repositories/drizzle-repository-read-model-adapter.js";
import { DrizzleSnapshotAdapter } from "../infrastructure/repositories/drizzle-snapshot-adapter.js";
import { DrizzleUnitOfWorkAdapter } from "../infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { RepositoryController } from "../interface/http/controllers/repository-controller.js";

export type AppContainer = Readonly<{
  repositoryController: RepositoryController;
  corsAllowedOrigins: readonly string[];
}>;

export const buildContainer = (appEnv: AppEnv): AppContainer => {
  const db = createDrizzleHandle(appEnv);
  migrateDrizzleDatabase(db);

  const repositoryAdapter = new DrizzleRepositoryAdapter(db);
  const snapshotAdapter = new DrizzleSnapshotAdapter(db);
  const repositoryReadModelAdapter = new DrizzleRepositoryReadModelAdapter(db);
  const unitOfWorkAdapter = new DrizzleUnitOfWorkAdapter(db);
  const repositoryGateway = new GitHubRestRepositoryGateway(appEnv);

  const listRepositoriesWithLatestSnapshotUseCase =
    new ListRepositoriesWithLatestSnapshotService(repositoryReadModelAdapter);
  const registerRepositoryUseCase = new RegisterRepositoryService(
    unitOfWorkAdapter,
    repositoryGateway,
  );
  const refreshRepositoryUseCase = new RefreshRepositoryService(
    repositoryAdapter,
    snapshotAdapter,
    repositoryGateway,
  );

  const repositoryController = new RepositoryController(
    listRepositoriesWithLatestSnapshotUseCase,
    registerRepositoryUseCase,
    refreshRepositoryUseCase,
  );

  return Object.freeze({
    repositoryController,
    corsAllowedOrigins: appEnv.CORS_ALLOWED_ORIGINS,
  });
};
