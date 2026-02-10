export const repositoriesKeys = {
  all: ["repositories"] as const,
  list: () => [...repositoriesKeys.all, "list"] as const,
  detail: (repositoryId: string) =>
    [...repositoriesKeys.all, "detail", repositoryId] as const,
};
