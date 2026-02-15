import { useQuery } from "@tanstack/react-query";
import { HttpRegistryAdoptionApiAdapter } from "../api/registry-adoption-api-adapter";

const adapter = new HttpRegistryAdoptionApiAdapter("");

export const useRegistryAdoptionRepositoriesQuery = () =>
  useQuery({
    queryKey: ["registry-adoption", "repositories"],
    queryFn: () => adapter.listRepositories(),
  });
