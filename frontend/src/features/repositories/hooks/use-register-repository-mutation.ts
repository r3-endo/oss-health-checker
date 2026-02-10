import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositoryApi } from "../../../app/repository-api-provider";
import type { RegisterRepositoryInput } from "../model/types";
import { repositoriesKeys } from "./query-keys";

export const useRegisterRepositoryMutation = () => {
  const api = useRepositoryApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterRepositoryInput) =>
      api.registerRepository(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: repositoriesKeys.list(),
      });
    },
  });
};
