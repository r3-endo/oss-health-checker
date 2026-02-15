export const repositoriesKeys = {
  all: ["dashboard"] as const,
  categories: () => [...repositoriesKeys.all, "categories"] as const,
  categoryDetail: (slug: string) =>
    [...repositoriesKeys.all, "category-detail", slug] as const,
};
