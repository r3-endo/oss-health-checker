import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";

export const useRequestGithubRefresh = () => {
  const api = useRepositoryApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const repositories = await api.listRepositories();
      for (const repository of repositories) {
        await api.refreshRepository(repository.id);
      }
      return repositories.length;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: repositoriesKeys.categories(),
        }),
        queryClient.invalidateQueries({ queryKey: repositoriesKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["registry-adoption"] }),
      ]);
    },
  });
};
