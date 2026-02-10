import { ListRepositoriesWithLatestSnapshotService } from "../application/use-cases/list-repositories-with-latest-snapshot-use-case";
import { RefreshRepositoryService } from "../application/use-cases/refresh-repository-use-case";
import { RegisterRepositoryService } from "../application/use-cases/register-repository-use-case";
import type { AppEnv } from "../infrastructure/config/env";
import { createDrizzleHandle } from "../infrastructure/db/drizzle/client";
import { migrateDrizzleDatabase } from "../infrastructure/db/drizzle/migrate";
import { GitHubRestRepositoryGateway } from "../infrastructure/gateways/github-rest-repository-gateway";
import { DrizzleRepositoryAdapter } from "../infrastructure/repositories/drizzle-repository-adapter";
import { DrizzleRepositoryReadModelAdapter } from "../infrastructure/repositories/drizzle-repository-read-model-adapter";
import { DrizzleSnapshotAdapter } from "../infrastructure/repositories/drizzle-snapshot-adapter";
import { RepositoryController } from "../interface/http/controllers/repository-controller";

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
  const repositoryGateway = new GitHubRestRepositoryGateway(appEnv);

  const listRepositoriesWithLatestSnapshotUseCase =
    new ListRepositoriesWithLatestSnapshotService(repositoryReadModelAdapter);
  const registerRepositoryUseCase = new RegisterRepositoryService(
    repositoryAdapter,
    snapshotAdapter,
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
