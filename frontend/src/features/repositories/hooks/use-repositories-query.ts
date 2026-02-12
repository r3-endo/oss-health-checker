import { useSuspenseQuery } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";

export const useRepositoriesQuery = () => {
  const api = useRepositoryApi();

  return useSuspenseQuery({
    queryKey: repositoriesKeys.list(),
    queryFn: () => api.listRepositories(),
  });
};
