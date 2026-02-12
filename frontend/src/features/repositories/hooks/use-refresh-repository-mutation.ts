import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import { repositoriesKeys } from "./query-keys";
import { resolveMutationErrorMessage } from "./error-message";

export const useRefreshRepositoryMutation = () => {
  const api = useRepositoryApi();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (repositoryId: string) => api.refreshRepository(repositoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: repositoriesKeys.list(),
      });
    },
  });

  return {
    ...mutation,
    errorMessage: resolveMutationErrorMessage({
      isError: mutation.isError,
      error: mutation.error,
      fallbackMessage: "Failed to refresh repository.",
    }),
  };
};
