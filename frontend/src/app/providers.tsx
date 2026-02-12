import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { RepositoryApiPort } from "../features/repositories/api/repository-api-port";
import { queryClient } from "./query-client";
import { RepositoryApiProvider } from "./repository-api-provider";
import { buildRepositoryApi } from "./repository-api-factory";

const defaultRepositoryApi = buildRepositoryApi();

export const AppProviders = ({
  children,
  repositoryApi = defaultRepositoryApi,
}: {
  children: ReactNode;
  repositoryApi?: RepositoryApiPort;
}) => (
  <QueryClientProvider client={queryClient}>
    <RepositoryApiProvider api={repositoryApi}>{children}</RepositoryApiProvider>
  </QueryClientProvider>
);
