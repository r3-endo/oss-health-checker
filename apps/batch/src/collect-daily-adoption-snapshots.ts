import { CollectDailyAdoptionSnapshotsService } from "@oss-health-checker/common/features/ecosystem-adoption/application/use-cases/collect-daily-adoption-snapshots-use-case.js";
import {
  REGISTRY_SOURCES,
  type RegistrySource,
} from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";
import { NpmRegistryProviderAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/providers/npm/npm-registry-provider-adapter.js";
import { RegistryProviderResolver } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/providers/registry-provider-resolver.js";
import { DrizzleAdoptionSnapshotAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-adoption-snapshot-adapter.js";
import { DrizzleRepositoryPackageMappingAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-package-mapping-adapter.js";
import { DrizzleRepositoryAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-repository-adapter.js";
import { env } from "@oss-health-checker/common/shared/config/env.js";
import { createDrizzleHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/seed-category-base.js";

const toEnabledSources = (
  sources: readonly string[],
): readonly RegistrySource[] => {
  const valid = new Set<string>(REGISTRY_SOURCES);
  return sources.filter((source): source is RegistrySource =>
    valid.has(source),
  );
};

const main = async (): Promise<void> => {
  const db = createDrizzleHandle(env);
  migrateDrizzleDatabase(db);
  seedCategoryBase(db);

  const repositoryPort = new DrizzleRepositoryAdapter(db);
  const mappingPort = new DrizzleRepositoryPackageMappingAdapter(db);
  const snapshotPort = new DrizzleAdoptionSnapshotAdapter(db);
  const resolver = new RegistryProviderResolver(
    [new NpmRegistryProviderAdapter(env)],
    toEnabledSources(env.ADOPTION_ENABLED_SOURCES),
  );

  const useCase = new CollectDailyAdoptionSnapshotsService(
    repositoryPort,
    mappingPort,
    snapshotPort,
    resolver,
  );

  const result = await useCase.executeAll();

  console.log(
    `[daily-adoption] success=${result.successes.length} failure=${result.failures.length} skipped=${result.skipped.length}`,
  );

  for (const failure of result.failures) {
    console.error(
      `[daily-adoption] repositoryId=${failure.repositoryId} code=${failure.code} message=${failure.message}`,
    );
  }
  for (const skipped of result.skipped) {
    console.log(
      `[daily-adoption] repositoryId=${skipped.repositoryId} skipped=${skipped.reason}`,
    );
  }

  if (result.failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  console.error("[daily-adoption] fatal error", error);
  process.exitCode = 1;
});
