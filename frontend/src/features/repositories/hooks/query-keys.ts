import type { RepositoryListParams } from "./use-repositories-query";

export const repositoriesKeys = {
  all: ["dashboard"] as const,
  categories: () => [...repositoriesKeys.all, "categories"] as const,
  categoryDetail: (slug: string) =>
    [...repositoriesKeys.all, "category-detail", slug] as const,
  list: (params: RepositoryListParams = {}) =>
    [...repositoriesKeys.all, "repositories", "list", params] as const,
  detail: (repositoryId: string) =>
    [...repositoriesKeys.all, "repositories", "detail", repositoryId] as const,
};
