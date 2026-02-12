import { useSuspenseQuery } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";

/**
 * Parameters for the repositories list query.
 * Extend with filter/sort/page fields as the product grows.
 */
export type RepositoryListParams = Record<string, never>;

/**
 * Suspense-based query hook for the repository list.
 *
 * **Must be rendered inside a `<Suspense>` boundary.**
 * Loading and error states are handled by Suspense and an ErrorBoundary
 * in the parent page component — this hook always returns resolved data.
 */
export const useRepositoriesQuery = (params: RepositoryListParams = {}) => {
  const api = useRepositoryApi();

  return useSuspenseQuery({
    queryKey: repositoriesKeys.list(params),
    queryFn: () => api.listRepositories(),
    staleTime: 30_000,
  });
};
