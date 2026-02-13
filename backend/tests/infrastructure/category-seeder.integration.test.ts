import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/shared/infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "../../src/shared/infrastructure/db/drizzle/seed-category-base.js";
import {
  adoptionSnapshotsTable,
  categoriesTable,
  repositoryPackageMappingsTable,
  repositoriesTable,
  repositoryCategoriesTable,
} from "../../src/shared/infrastructure/db/drizzle/schema.js";
import { RegisterRepositoryService } from "../../src/features/development-health/application/use-cases/register-repository-use-case.js";
import { DrizzleUnitOfWorkAdapter } from "../../src/features/development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { eq } from "drizzle-orm";
import type { RepositoryGatewayPort } from "../../src/features/development-health/application/ports/repository-gateway-port.js";
import { ListRepositoriesWithLatestSnapshotService } from "../../src/features/development-health/application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { DrizzleRepositoryReadModelAdapter } from "../../src/features/development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.js";

const createGateway = (): RepositoryGatewayPort => ({
  fetchSignals: async () => ({
    lastCommitAt: new Date("2026-02-10T00:00:00Z"),
    lastReleaseAt: null,
    openIssuesCount: 10,
    contributorsCount: 5,
  }),
});

describe("category base seeder", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "category-seeder-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("seeds categories, default repositories, and relations idempotently", async () => {
    seedCategoryBase(db);
    seedCategoryBase(db);

    const categories = await db.db.select().from(categoriesTable);
    const repositories = await db.db.select().from(repositoriesTable);
    const relations = await db.db.select().from(repositoryCategoriesTable);
    const packageMappings = await db.db
      .select()
      .from(repositoryPackageMappingsTable);
    const adoptionSnapshots = await db.db.select().from(adoptionSnapshotsTable);

    expect(categories).toHaveLength(3);
    expect(repositories).toHaveLength(11);
    expect(relations).toHaveLength(12);
    expect(packageMappings).toHaveLength(7);
    expect(adoptionSnapshots).toHaveLength(7);

    const slugSet = new Set(categories.map((category) => category.slug));
    expect(slugSet).toEqual(new Set(["llm", "backend", "frontend"]));

    const packageNameSet = new Set(
      packageMappings.map((mapping) => mapping.packageName),
    );
    expect(packageNameSet).toEqual(
      new Set([
        "hono",
        "@hono/zod-openapi",
        "drizzle-orm",
        "zod",
        "react",
        "@tanstack/react-query",
        "jotai",
      ]),
    );
  });

  it("coexists with manual registration and avoids duplicate seeded URL records", async () => {
    seedCategoryBase(db);
    const unitOfWork = new DrizzleUnitOfWorkAdapter(db);
    const registerUseCase = new RegisterRepositoryService(
      unitOfWork,
      createGateway(),
      () => new Date("2026-02-13T00:00:00Z"),
    );

    const seededUrl = "https://github.com/openai/openai-agent-sdk";
    const first = await registerUseCase.execute({ url: seededUrl });
    const second = await registerUseCase.execute({ url: seededUrl });

    expect(first.repository.id).toBe(second.repository.id);

    await registerUseCase.execute({
      url: "https://github.com/octocat/Hello-World",
    });

    const seededRows = await db.db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.url, seededUrl));
    expect(seededRows).toHaveLength(1);

    const listUseCase = new ListRepositoriesWithLatestSnapshotService(
      new DrizzleRepositoryReadModelAdapter(db),
    );
    const listed = await listUseCase.execute();
    const listedUrls = new Set(listed.map((row) => row.repository.url));
    expect(listedUrls.has(seededUrl)).toBe(true);
    expect(listedUrls.has("https://github.com/octocat/Hello-World")).toBe(true);
  });

  it("removes legacy backend/frontend seeded repositories no longer in current seed set", async () => {
    const now = new Date("2026-02-10T00:00:00.000Z");
    await db.db.insert(categoriesTable).values([
      {
        id: "cat-backend",
        slug: "backend",
        name: "Backend Frameworks",
        displayOrder: 2,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cat-frontend",
        slug: "frontend",
        name: "Frontend Frameworks",
        displayOrder: 3,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.db.insert(repositoriesTable).values({
      id: "seed-spring-projects-spring-boot",
      owner: "spring-projects",
      name: "spring-boot",
      url: "https://github.com/spring-projects/spring-boot",
      createdAt: now,
      updatedAt: now,
    });
    await db.db.insert(repositoryCategoriesTable).values({
      repositoryId: "seed-spring-projects-spring-boot",
      categoryId: "cat-backend",
      createdAt: now,
    });
    await db.db.insert(repositoryPackageMappingsTable).values({
      repositoryId: "seed-spring-projects-spring-boot",
      source: "npm",
      packageName: "spring-boot",
      createdAt: now,
      updatedAt: now,
    });
    await db.db.insert(adoptionSnapshotsTable).values({
      id: "seed-adoption-seed-spring-projects-spring-boot",
      repositoryId: "seed-spring-projects-spring-boot",
      source: "npm",
      packageName: "spring-boot",
      weeklyDownloads: 1,
      downloadsDelta7d: 0,
      downloadsDelta30d: 0,
      lastPublishedAt: "2026-02-01T00:00:00.000Z",
      latestVersion: "0.0.0",
      fetchStatus: "succeeded",
      fetchedAt: now,
    });

    seedCategoryBase(db);

    const legacyRepo = await db.db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.id, "seed-spring-projects-spring-boot"));
    const legacyMapping = await db.db
      .select()
      .from(repositoryPackageMappingsTable)
      .where(
        eq(
          repositoryPackageMappingsTable.repositoryId,
          "seed-spring-projects-spring-boot",
        ),
      );
    const legacySnapshot = await db.db
      .select()
      .from(adoptionSnapshotsTable)
      .where(
        eq(
          adoptionSnapshotsTable.repositoryId,
          "seed-spring-projects-spring-boot",
        ),
      );

    expect(legacyRepo).toHaveLength(0);
    expect(legacyMapping).toHaveLength(0);
    expect(legacySnapshot).toHaveLength(0);
  });
});
