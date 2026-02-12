import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { RepositoryApiPort } from "../features/repositories/api/repository-api-port";

const RepositoryApiContext = createContext<RepositoryApiPort | null>(null);

export const RepositoryApiProvider = ({
  children,
  api,
}: {
  children: ReactNode;
  api: RepositoryApiPort;
}) => (
  <RepositoryApiContext.Provider value={api}>
    {children}
  </RepositoryApiContext.Provider>
);

export const useRepositoryApi = (): RepositoryApiPort => {
  const api = useContext(RepositoryApiContext);

  if (!api) {
    throw new Error("RepositoryApiProvider is missing");
  }

  return api;
};
