import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/infrastructure/db/drizzle/migrate.js";
import { seedCategoryBase } from "../../src/infrastructure/db/drizzle/seed-category-base.js";
import {
  categoriesTable,
  repositoriesTable,
  repositoryCategoriesTable,
} from "../../src/infrastructure/db/drizzle/schema.js";
import { RegisterRepositoryService } from "../../src/application/use-cases/register-repository-use-case.js";
import { DrizzleUnitOfWorkAdapter } from "../../src/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { eq } from "drizzle-orm";
import type { RepositoryGatewayPort } from "../../src/application/ports/repository-gateway-port.js";
import { ListRepositoriesWithLatestSnapshotService } from "../../src/application/use-cases/list-repositories-with-latest-snapshot-use-case.js";
import { DrizzleRepositoryReadModelAdapter } from "../../src/infrastructure/repositories/drizzle-repository-read-model-adapter.js";

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

    expect(categories).toHaveLength(3);
    expect(repositories).toHaveLength(10);
    expect(relations).toHaveLength(10);

    const slugSet = new Set(categories.map((category) => category.slug));
    expect(slugSet).toEqual(new Set(["llm", "backend", "frontend"]));
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
});
