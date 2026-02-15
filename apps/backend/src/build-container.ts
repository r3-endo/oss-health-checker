import { ListRepositoriesWithLatestSnapshotService } from "@backend/features/development-health/application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { GetCategoryDetailService } from "@backend/features/development-health/application/use-cases/get-category-detail-use-case.js";
import { ListCategorySummariesService } from "@backend/features/development-health/application/use-cases/list-category-summaries-use-case.js";
import { RefreshRepositoryService } from "@backend/features/development-health/application/use-cases/refresh-repository-use-case.js";
import { RegisterRepositoryService } from "@backend/features/development-health/application/use-cases/register-repository-use-case.js";
import { RefreshRepositoryAdoptionService } from "@backend/features/ecosystem-adoption/application/use-cases/refresh-repository-adoption-use-case.js";
import { ListDashboardRepositoriesService } from "@backend/features/dashboard-overview/application/use-cases/list-dashboard-repositories-use-case.js";
import type { AppEnv } from "@oss-health-checker/common/shared/config/env.js";
import { createDrizzleHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/seed-category-base.js";
import { GitHubRestRepositoryGateway } from "@oss-health-checker/common/features/development-health/infrastructure/gateways/github-rest-repository-gateway.js";
import { DrizzleCategoryReadAdapter } from "@backend/features/development-health/infrastructure/repositories/drizzle-category-read-adapter.js";
import { DrizzleRepositoryAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleRepositoryReadModelAdapter } from "@backend/features/development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.js";
import { DrizzleRepositorySnapshotAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-snapshot-adapter.js";
import { DrizzleRepositorySnapshotReadAdapter } from "@backend/features/development-health/infrastructure/repositories/drizzle-repository-snapshot-read-adapter.js";
import { DrizzleSnapshotAdapter } from "@backend/features/development-health/infrastructure/repositories/drizzle-snapshot-adapter.js";
import { DrizzleUnitOfWorkAdapter } from "@backend/features/development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { DrizzleRegistryDataAdapter } from "@backend/features/development-health/infrastructure/repositories/drizzle-registry-data-adapter.js";
import { CategoryController } from "@backend/features/development-health/interface/http/controllers/category-controller.js";
import { RepositoryController } from "@backend/features/development-health/interface/http/controllers/repository-controller.js";
import { AdoptionController } from "@backend/features/ecosystem-adoption/interface/http/controllers/adoption-controller.js";
import { DrizzleRepositoryPackageMappingAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-package-mapping-adapter.js";
import { DrizzleAdoptionSnapshotAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-adoption-snapshot-adapter.js";
import { NpmRegistryProviderAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/providers/npm/npm-registry-provider-adapter.js";
import { RegistryProviderResolver } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/providers/registry-provider-resolver.js";
import {
  REGISTRY_SOURCES,
  type RegistrySource,
} from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";
import { DrizzleRepositoryAdoptionReadAdapter } from "@backend/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-adoption-read-adapter.js";
import { DashboardController } from "@backend/features/dashboard-overview/interface/http/controllers/dashboard-controller.js";

export type AppContainer = Readonly<{
  categoryController: CategoryController;
  repositoryController: RepositoryController;
  adoptionController: AdoptionController;
  dashboardController: DashboardController;
  corsAllowedOrigins: readonly string[];
}>;

const toEnabledSources = (
  sources: readonly string[],
): readonly RegistrySource[] => {
  const valid = new Set<string>(REGISTRY_SOURCES);
  return sources.filter((source): source is RegistrySource =>
    valid.has(source),
  );
};

export const buildContainer = (appEnv: AppEnv): AppContainer => {
  const db = createDrizzleHandle(appEnv);
  migrateDrizzleDatabase(db);
  seedCategoryBase(db);

  const repositoryAdapter = new DrizzleRepositoryAdapter(db);
  const snapshotAdapter = new DrizzleSnapshotAdapter(db);
  const repositoryReadModelAdapter = new DrizzleRepositoryReadModelAdapter(db);
  const repositorySnapshotAdapter = new DrizzleRepositorySnapshotAdapter(db);
  const repositorySnapshotReadAdapter =
    new DrizzleRepositorySnapshotReadAdapter(db);
  const categoryReadAdapter = new DrizzleCategoryReadAdapter(db);
  const unitOfWorkAdapter = new DrizzleUnitOfWorkAdapter(db);
  const registryDataAdapter = new DrizzleRegistryDataAdapter(db);
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
    registryDataAdapter,
  );

  const repositoryPackageMappingAdapter =
    new DrizzleRepositoryPackageMappingAdapter(db);
  const adoptionSnapshotAdapter = new DrizzleAdoptionSnapshotAdapter(db);
  const adoptionReadAdapter = new DrizzleRepositoryAdoptionReadAdapter(
    repositoryPackageMappingAdapter,
    adoptionSnapshotAdapter,
  );

  const registryProviders = [new NpmRegistryProviderAdapter(appEnv)] as const;
  const providerResolver = new RegistryProviderResolver(
    registryProviders,
    toEnabledSources(appEnv.ADOPTION_ENABLED_SOURCES),
  );

  const refreshRepositoryAdoptionUseCase = new RefreshRepositoryAdoptionService(
    repositoryAdapter,
    repositoryPackageMappingAdapter,
    adoptionSnapshotAdapter,
    providerResolver,
  );

  const listDashboardRepositoriesUseCase = new ListDashboardRepositoriesService(
    repositoryReadModelAdapter,
    adoptionReadAdapter,
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
  const adoptionController = new AdoptionController(
    refreshRepositoryAdoptionUseCase,
  );
  const dashboardController = new DashboardController(
    listDashboardRepositoriesUseCase,
  );

  return Object.freeze({
    categoryController,
    repositoryController,
    adoptionController,
    dashboardController,
    corsAllowedOrigins: appEnv.CORS_ALLOWED_ORIGINS,
  });
};
