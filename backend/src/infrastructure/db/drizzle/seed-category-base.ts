import { and, eq } from "drizzle-orm";
import type { DrizzleDatabaseHandle } from "./client.js";
import {
  categoriesTable,
  repositoriesTable,
  repositoryCategoriesTable,
} from "./schema.js";

type SeedCategory = Readonly<{
  id: string;
  slug: "llm" | "backend" | "frontend";
  name: string;
  displayOrder: number;
  repositories: readonly Readonly<{ owner: string; name: string }>[];
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
      { owner: "spring-projects", name: "spring-boot" },
      { owner: "honojs", name: "hono" },
      { owner: "nodejs", name: "node" },
    ],
  },
  {
    id: "cat-frontend",
    slug: "frontend",
    name: "Frontend Frameworks",
    displayOrder: 3,
    repositories: [
      { owner: "facebook", name: "react" },
      { owner: "vuejs", name: "core" },
      { owner: "sveltejs", name: "svelte" },
    ],
  },
] as const;

const buildRepoUrl = (owner: string, name: string): string =>
  `https://github.com/${owner}/${name}`;

const makeRepositoryId = (owner: string, name: string): string =>
  `seed-${owner}-${name}`.toLowerCase();

export const seedCategoryBase = (db: DrizzleDatabaseHandle): void => {
  const now = new Date();

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

    const seededRepositories = SEED_CATEGORIES.flatMap((category) =>
      category.repositories.map((repository) => ({
        id: makeRepositoryId(repository.owner, repository.name),
        url: buildRepoUrl(repository.owner, repository.name),
        owner: repository.owner,
        name: repository.name,
      })),
    );

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
  });
};
