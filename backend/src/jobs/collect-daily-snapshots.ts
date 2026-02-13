import { CollectDailySnapshotsService } from "../application/use-cases/collect-daily-snapshots-use-case.js";
import { env } from "../infrastructure/config/env.js";
import { createDrizzleHandle } from "../infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "../infrastructure/db/drizzle/seed-category-base.js";
import { GitHubRestRepositoryGateway } from "../infrastructure/gateways/github-rest-repository-gateway.js";
import { DrizzleRepositoryAdapter } from "../infrastructure/repositories/drizzle-repository-adapter.js";
import { DrizzleRepositorySnapshotAdapter } from "../infrastructure/repositories/drizzle-repository-snapshot-adapter.js";

const main = async (): Promise<void> => {
  const db = createDrizzleHandle(env);
  migrateDrizzleDatabase(db);
  seedCategoryBase(db);

  const repositoryPort = new DrizzleRepositoryAdapter(db);
  const repositorySnapshotWritePort = new DrizzleRepositorySnapshotAdapter(db);
  const repositoryGatewayPort = new GitHubRestRepositoryGateway(env);
  const collectDailySnapshotsUseCase = new CollectDailySnapshotsService(
    repositoryPort,
    repositoryGatewayPort,
    repositorySnapshotWritePort,
  );

  const result = await collectDailySnapshotsUseCase.executeAll();

  console.log(
    `[daily-snapshot] success=${result.successes.length} failure=${result.failures.length}`,
  );
  for (const failure of result.failures) {
    console.error(
      `[daily-snapshot] repositoryId=${failure.repositoryId} code=${failure.code} message=${failure.message}`,
    );
  }

  if (result.failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  console.error("[daily-snapshot] fatal error", error);
  process.exitCode = 1;
});
