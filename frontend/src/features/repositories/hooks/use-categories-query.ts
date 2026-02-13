import { useQuery } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";

export const useCategoriesQuery = () => {
  const api = useRepositoryApi();

  return useQuery({
    queryKey: repositoriesKeys.categories(),
    queryFn: () => api.listCategories(),
    staleTime: 30_000,
  });
};
