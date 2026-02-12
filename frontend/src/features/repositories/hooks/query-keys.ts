import type { RepositoryListParams } from "./use-repositories-query";

export const repositoriesKeys = {
  all: ["repositories"] as const,
  list: (params: RepositoryListParams = {}) =>
    [...repositoriesKeys.all, "list", params] as const,
  detail: (repositoryId: string) =>
    [...repositoriesKeys.all, "detail", repositoryId] as const,
};
