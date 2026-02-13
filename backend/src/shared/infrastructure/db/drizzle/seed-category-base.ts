import { and, eq, inArray, like } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "./client.js";
import {
  adoptionSnapshotsTable,
  categoriesTable,
  repositoryPackageMappingsTable,
  repositoriesTable,
  repositoryCategoriesTable,
} from "./schema.js";

type SeedCategory = Readonly<{
  id: string;
  slug: "llm" | "backend" | "frontend";
  name: string;
  displayOrder: number;
  repositories: readonly SeedRepository[];
}>;

type SeedRepository = Readonly<{
  owner: string;
  name: string;
  npm?: Readonly<{
    packageName: string;
    weeklyDownloads: number;
    downloadsDelta7d: number;
    downloadsDelta30d: number;
    lastPublishedAt: string;
    latestVersion: string;
  }>;
}>;

const SEED_CATEGORIES: readonly SeedCategory[] = [
  {
    id: "cat-llm",
    slug: "llm",
    name: "Large Language Models",
    displayOrder: 1,
    repositories: [
      { owner: "openai", name: "openai-agent-sdk" },
      { owner: "mastra-ai", name: "mastra" },
      { owner: "langchain-ai", name: "langchain" },
      { owner: "run-llama", name: "llama_index" },
    ],
  },
  {
    id: "cat-backend",
    slug: "backend",
    name: "Backend Frameworks",
    displayOrder: 2,
    repositories: [
      {
        owner: "honojs",
        name: "hono",
        npm: {
          packageName: "hono",
          weeklyDownloads: 8300000,
          downloadsDelta7d: 220000,
          downloadsDelta30d: 910000,
          lastPublishedAt: "2026-02-01T00:00:00.000Z",
          latestVersion: "4.11.9",
        },
      },
      {
        owner: "honojs",
        name: "middleware",
        npm: {
          packageName: "@hono/zod-openapi",
          weeklyDownloads: 1050000,
          downloadsDelta7d: 42000,
          downloadsDelta30d: 166000,
          lastPublishedAt: "2026-01-29T00:00:00.000Z",
          latestVersion: "1.2.1",
        },
      },
      {
        owner: "drizzle-team",
        name: "drizzle-orm",
        npm: {
          packageName: "drizzle-orm",
          weeklyDownloads: 6400000,
          downloadsDelta7d: 175000,
          downloadsDelta30d: 740000,
          lastPublishedAt: "2026-01-27T00:00:00.000Z",
          latestVersion: "0.45.1",
        },
      },
      {
        owner: "colinhacks",
        name: "zod",
        npm: {
          packageName: "zod",
          weeklyDownloads: 51000000,
          downloadsDelta7d: 920000,
          downloadsDelta30d: 3700000,
          lastPublishedAt: "2026-01-30T00:00:00.000Z",
          latestVersion: "4.3.6",
        },
      },
    ],
  },
  {
    id: "cat-frontend",
    slug: "frontend",
    name: "Frontend Frameworks",
    displayOrder: 3,
    repositories: [
      {
        owner: "facebook",
        name: "react",
        npm: {
          packageName: "react",
          weeklyDownloads: 29500000,
          downloadsDelta7d: 630000,
          downloadsDelta30d: 2450000,
          lastPublishedAt: "2026-01-25T00:00:00.000Z",
          latestVersion: "19.2.4",
        },
      },
      {
        owner: "TanStack",
        name: "query",
        npm: {
          packageName: "@tanstack/react-query",
          weeklyDownloads: 7400000,
          downloadsDelta7d: 190000,
          downloadsDelta30d: 760000,
          lastPublishedAt: "2026-02-02T00:00:00.000Z",
          latestVersion: "5.90.20",
        },
      },
      {
        owner: "pmndrs",
        name: "jotai",
        npm: {
          packageName: "jotai",
          weeklyDownloads: 2100000,
          downloadsDelta7d: 46000,
          downloadsDelta30d: 182000,
          lastPublishedAt: "2026-01-31T00:00:00.000Z",
          latestVersion: "2.17.1",
        },
      },
      {
        owner: "colinhacks",
        name: "zod",
        npm: {
          packageName: "zod",
          weeklyDownloads: 51000000,
          downloadsDelta7d: 920000,
          downloadsDelta30d: 3700000,
          lastPublishedAt: "2026-01-30T00:00:00.000Z",
          latestVersion: "4.3.6",
        },
      },
    ],
  },
] as const;

type SeededRepositoryRow = Readonly<{
  id: string;
  owner: string;
  name: string;
  url: string;
  npm: SeedRepository["npm"];
}>;

const toSeededRepositories = (): readonly SeededRepositoryRow[] => {
  const byId = new Map<string, SeededRepositoryRow>();

  for (const category of SEED_CATEGORIES) {
    for (const repository of category.repositories) {
      const id = makeRepositoryId(repository.owner, repository.name);
      const existing = byId.get(id);

      if (!existing) {
        byId.set(
          id,
          Object.freeze({
            id,
            owner: repository.owner,
            name: repository.name,
            url: buildRepoUrl(repository.owner, repository.name),
            npm: repository.npm,
          }),
        );
        continue;
      }

      if (!existing.npm && repository.npm) {
        byId.set(
          id,
          Object.freeze({
            ...existing,
            npm: repository.npm,
          }),
        );
      }
    }
  }

  return [...byId.values()];
};

const makeAdoptionSnapshotId = (repositoryId: string): string =>
  `seed-adoption-${repositoryId}`;

const ADOPTION_SOURCE = "npm" as const;
const PROJECT_CATEGORY_SLUGS = ["backend", "frontend"] as const;

export const seedCategoryBase = (db: DrizzleDatabaseHandle): void => {
  const now = new Date();
  const seededRepositories = toSeededRepositories();
  const backendFrontendSeedRepositoryIds = new Set(
    SEED_CATEGORIES.filter((category) =>
      PROJECT_CATEGORY_SLUGS.includes(category.slug),
    )
      .flatMap((category) => category.repositories)
      .map((repository) => makeRepositoryId(repository.owner, repository.name)),
  );

  db.db.transaction((tx) => {
    tx.insert(categoriesTable)
      .values(
        SEED_CATEGORIES.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          displayOrder: category.displayOrder,
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing({ target: categoriesTable.slug })
      .run();

    tx.insert(repositoriesTable)
      .values(
        seededRepositories.map((repository) => ({
          id: repository.id,
          url: repository.url,
          owner: repository.owner,
          name: repository.name,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing({ target: repositoriesTable.url })
      .run();

    for (const category of SEED_CATEGORIES) {
      for (const repository of category.repositories) {
        const url = buildRepoUrl(repository.owner, repository.name);
        const existingRepository = tx
          .select({ id: repositoriesTable.id })
          .from(repositoriesTable)
          .where(eq(repositoriesTable.url, url))
          .limit(1)
          .get();
        if (!existingRepository) {
          continue;
        }

        const existingRelation = tx
          .select({
            repositoryId: repositoryCategoriesTable.repositoryId,
          })
          .from(repositoryCategoriesTable)
          .where(
            and(
              eq(repositoryCategoriesTable.repositoryId, existingRepository.id),
              eq(repositoryCategoriesTable.categoryId, category.id),
            ),
          )
          .limit(1)
          .get();
        if (existingRelation) {
          continue;
        }

        tx.insert(repositoryCategoriesTable)
          .values({
            repositoryId: existingRepository.id,
            categoryId: category.id,
            createdAt: now,
          })
          .run();
      }
    }

    const legacyProjectSeedRepositoryIds = new Set(
      tx
        .select({ repositoryId: repositoriesTable.id })
        .from(repositoryCategoriesTable)
        .innerJoin(
          categoriesTable,
          eq(repositoryCategoriesTable.categoryId, categoriesTable.id),
        )
        .innerJoin(
          repositoriesTable,
          eq(repositoryCategoriesTable.repositoryId, repositoriesTable.id),
        )
        .where(
          and(
            inArray(categoriesTable.slug, PROJECT_CATEGORY_SLUGS),
            like(repositoriesTable.id, "seed-%"),
          ),
        )
        .all()
        .map((row) => row.repositoryId)
        .filter((id) => !backendFrontendSeedRepositoryIds.has(id)),
    );

    if (legacyProjectSeedRepositoryIds.size > 0) {
      const legacyIds = [...legacyProjectSeedRepositoryIds];

      tx.delete(repositoryCategoriesTable)
        .where(inArray(repositoryCategoriesTable.repositoryId, legacyIds))
        .run();
      tx.delete(repositoryPackageMappingsTable)
        .where(inArray(repositoryPackageMappingsTable.repositoryId, legacyIds))
        .run();
      tx.delete(adoptionSnapshotsTable)
        .where(inArray(adoptionSnapshotsTable.repositoryId, legacyIds))
        .run();

      const repositoryIdsStillRelated = new Set(
        tx
          .selectDistinct({
            repositoryId: repositoryCategoriesTable.repositoryId,
          })
          .from(repositoryCategoriesTable)
          .where(inArray(repositoryCategoriesTable.repositoryId, legacyIds))
          .all()
          .map((row) => row.repositoryId),
      );
      const repositoryIdsToDelete = legacyIds.filter(
        (id) => !repositoryIdsStillRelated.has(id),
      );

      if (repositoryIdsToDelete.length > 0) {
        tx.delete(repositoriesTable)
          .where(inArray(repositoriesTable.id, repositoryIdsToDelete))
          .run();
      }
    }

    const npmRepositories = seededRepositories.filter(
      (
        repository,
      ): repository is SeededRepositoryRow & {
        npm: NonNullable<SeedRepository["npm"]>;
      } => repository.npm !== undefined,
    );

    if (npmRepositories.length === 0) {
      return;
    }

    tx.insert(repositoryPackageMappingsTable)
      .values(
        npmRepositories.map((repository) => ({
          repositoryId: repository.id,
          source: ADOPTION_SOURCE,
          packageName: repository.npm.packageName,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing({
        target: repositoryPackageMappingsTable.repositoryId,
      })
      .run();

    tx.insert(adoptionSnapshotsTable)
      .values(
        npmRepositories.map((repository) => ({
          id: makeAdoptionSnapshotId(repository.id),
          repositoryId: repository.id,
          source: ADOPTION_SOURCE,
          packageName: repository.npm.packageName,
          weeklyDownloads: repository.npm.weeklyDownloads,
          downloadsDelta7d: repository.npm.downloadsDelta7d,
          downloadsDelta30d: repository.npm.downloadsDelta30d,
          lastPublishedAt: repository.npm.lastPublishedAt,
          latestVersion: repository.npm.latestVersion,
          fetchStatus: "succeeded" as const,
          fetchedAt: now,
        })),
      )
      .onConflictDoNothing({ target: adoptionSnapshotsTable.id })
      .run();
  });
};

const buildRepoUrl = (owner: string, name: string): string =>
  `https://github.com/${owner}/${name}`;

const makeRepositoryId = (owner: string, name: string): string =>
  `seed-${owner}-${name}`.toLowerCase();
