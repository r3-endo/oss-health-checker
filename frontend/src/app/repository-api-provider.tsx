import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { HttpRepositoryApiAdapter } from "../features/repositories/api/repository-api-adapter";
import type { RepositoryApiPort } from "../features/repositories/api/repository-api-port";

const RepositoryApiContext = createContext<RepositoryApiPort | null>(null);

const defaultApi = new HttpRepositoryApiAdapter("");

export const RepositoryApiProvider = ({
  children,
  api = defaultApi,
}: {
  children: ReactNode;
  api?: RepositoryApiPort;
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
