import { useQuery } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";

export const useCategoryDetailQuery = (slug: string | null) => {
  const api = useRepositoryApi();

  return useQuery({
    queryKey: repositoriesKeys.categoryDetail(slug ?? ""),
    queryFn: () => api.getCategoryDetail(slug ?? ""),
    enabled: slug !== null,
    staleTime: 0,
  });
};
