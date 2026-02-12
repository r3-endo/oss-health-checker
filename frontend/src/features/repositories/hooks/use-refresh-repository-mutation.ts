import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";

export const useRefreshRepositoryMutation = () => {
  const api = useRepositoryApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repositoryId: string) => api.refreshRepository(repositoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: repositoriesKeys.list(),
      });
    },
  });
};
