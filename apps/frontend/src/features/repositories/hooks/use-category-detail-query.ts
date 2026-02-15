import { useQuery } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";
import { resolveApiErrorMessage } from "./error-message";

export const useCategoryDetailQuery = (slug: string | null) => {
  const api = useRepositoryApi();

  const query = useQuery({
    queryKey: repositoriesKeys.categoryDetail(slug ?? ""),
    queryFn: () => api.getCategoryDetail(slug ?? ""),
    enabled: slug !== null,
    staleTime: 0,
  });

  return {
    ...query,
    errorMessage: resolveApiErrorMessage({
      isError: query.isError,
      error: query.error,
      fallbackMessage: "Failed to load category repositories.",
    }),
  };
};
