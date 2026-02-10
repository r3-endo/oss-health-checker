import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClient } from "./query-client";
import { RepositoryApiProvider } from "./repository-api-provider";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <RepositoryApiProvider>{children}</RepositoryApiProvider>
  </QueryClientProvider>
);
