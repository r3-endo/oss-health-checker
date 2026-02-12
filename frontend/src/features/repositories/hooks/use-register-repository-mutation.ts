import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import type { RegisterRepositoryInput } from "../model/types";
import { repositoriesKeys } from "./query-keys";
import { resolveMutationErrorMessage } from "./error-message";

export const useRegisterRepositoryMutation = () => {
  const api = useRepositoryApi();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: RegisterRepositoryInput) =>
      api.registerRepository(input),
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
      fallbackMessage: "Failed to register repository.",
    }),
  };
};
