import { useQuery } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";
import { resolveApiErrorMessage } from "./error-message";

export const useCategoriesQuery = () => {
  const api = useRepositoryApi();

  const query = useQuery({
    queryKey: repositoriesKeys.categories(),
    queryFn: () => api.listCategories(),
    staleTime: 30_000,
  });

  return {
    ...query,
    errorMessage: resolveApiErrorMessage({
      isError: query.isError,
      error: query.error,
      fallbackMessage: "Failed to load categories.",
    }),
  };
};
