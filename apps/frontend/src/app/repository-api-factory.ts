import { HttpRepositoryApiAdapter } from "../features/repositories/api/repository-api-adapter";
import type { RepositoryApiPort } from "../features/repositories/api/repository-api-port";

export const buildRepositoryApi = (baseUrl = ""): RepositoryApiPort =>
  new HttpRepositoryApiAdapter(baseUrl);
