import { ListRepositoriesWithLatestSnapshotService } from "../../features/development-health/application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { GetCategoryDetailService } from "../../features/development-health/application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "../../features/development-health/application/use-cases/list-category-summaries-use-case.js";
import { RefreshRepositoryService } from "../../features/development-health/application/use-cases/refresh-repository-use-case.js";
import { RegisterRepositoryService } from "../../features/development-health/application/use-cases/register-repository-use-case.js";
import type { AppEnv } from "../config/env.js";
import { createDrizzleHandle } from "../infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "../infrastructure/db/drizzle/seed-category-base.js";
import { GitHubRestRepositoryGateway } from "../../features/development-health/infrastructure/gateways/github-rest-repository-gateway.js";
import { DrizzleCategoryReadAdapter } from "../../features/development-health/infrastructure/repositories/drizzle-category-read-adapter.js";
import { DrizzleRepositoryAdapter } from "../../features/development-health/infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleRepositoryReadModelAdapter } from "../../features/development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.js";
import { DrizzleRepositorySnapshotAdapter } from "../../features/development-health/infrastructure/repositories/drizzle-repository-snapshot-adapter.js";
import { DrizzleSnapshotAdapter } from "../../features/development-health/infrastructure/repositories/drizzle-snapshot-adapter.js";
import { DrizzleUnitOfWorkAdapter } from "../../features/development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { CategoryController } from "../../features/development-health/interface/http/controllers/category-controller.js";
import { RepositoryController } from "../../features/development-health/interface/http/controllers/repository-controller.js";

export type AppContainer = Readonly<{
  categoryController: CategoryController;
  repositoryController: RepositoryController;
  corsAllowedOrigins: readonly string[];
}>;

export const buildContainer = (appEnv: AppEnv): AppContainer => {
  const db = createDrizzleHandle(appEnv);
  migrateDrizzleDatabase(db);
  seedCategoryBase(db);

  const repositoryAdapter = new DrizzleRepositoryAdapter(db);
  const snapshotAdapter = new DrizzleSnapshotAdapter(db);
  const repositoryReadModelAdapter = new DrizzleRepositoryReadModelAdapter(db);
  const repositorySnapshotAdapter = new DrizzleRepositorySnapshotAdapter(db);
  const categoryReadAdapter = new DrizzleCategoryReadAdapter(db);
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
    repositorySnapshotAdapter,
    repositoryGateway,
  );
  const listCategorySummariesUseCase = new ListCategorySummariesService(
    categoryReadAdapter,
  );
  const getCategoryDetailUseCase = new GetCategoryDetailService(
    categoryReadAdapter,
    repositoryGateway,
  );

  const repositoryController = new RepositoryController(
    listRepositoriesWithLatestSnapshotUseCase,
    registerRepositoryUseCase,
    refreshRepositoryUseCase,
  );
  const categoryController = new CategoryController(
    listCategorySummariesUseCase,
    getCategoryDetailUseCase,
  );

  return Object.freeze({
    categoryController,
    repositoryController,
    corsAllowedOrigins: appEnv.CORS_ALLOWED_ORIGINS,
  });
};
