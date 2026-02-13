import { ListRepositoriesWithLatestSnapshotService } from "../application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { GetCategoryDetailService } from "../application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "../application/use-cases/list-category-summaries-use-case.js";
import { RefreshRepositoryService } from "../application/use-cases/refresh-repository-use-case.js";
import { RegisterRepositoryService } from "../application/use-cases/register-repository-use-case.js";
import type { AppEnv } from "../infrastructure/config/env.js";
import { createDrizzleHandle } from "../infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "../infrastructure/db/drizzle/seed-category-base.js";
import { GitHubRestRepositoryGateway } from "../infrastructure/gateways/github-rest-repository-gateway.js";
import { DrizzleCategoryReadAdapter } from "../infrastructure/repositories/drizzle-category-read-adapter.js";
import { DrizzleRepositoryAdapter } from "../infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleRepositoryReadModelAdapter } from "../infrastructure/repositories/drizzle-repository-read-model-adapter.js";
import { DrizzleRepositorySnapshotAdapter } from "../infrastructure/repositories/drizzle-repository-snapshot-adapter.js";
import { DrizzleRepositorySnapshotReadAdapter } from "../infrastructure/repositories/drizzle-repository-snapshot-read-adapter.js";
import { DrizzleSnapshotAdapter } from "../infrastructure/repositories/drizzle-snapshot-adapter.js";
import { DrizzleUnitOfWorkAdapter } from "../infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { CategoryController } from "../interface/http/controllers/category-controller.js";
import { RepositoryController } from "../interface/http/controllers/repository-controller.js";

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
  const repositorySnapshotReadAdapter = new DrizzleRepositorySnapshotReadAdapter(
    db,
  );
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
    repositorySnapshotReadAdapter,
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
