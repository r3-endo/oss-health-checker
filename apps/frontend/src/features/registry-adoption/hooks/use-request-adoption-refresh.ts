import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HttpRegistryAdoptionApiAdapter } from "../api/registry-adoption-api-adapter";

const adapter = new HttpRegistryAdoptionApiAdapter("");

export const useRequestAdoptionRefresh = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repositoryIds: readonly string[]) => {
      for (const repositoryId of repositoryIds) {
        await adapter.refreshRepositoryAdoption(repositoryId);
      }
      return repositoryIds.length;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["registry-adoption"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};
