import type { RegistrySource } from "../../domain/models/adoption.js";

export class RegistryProviderError extends Error {
  constructor(
    public readonly code: "RATE_LIMIT" | "API_ERROR",
    message: string,
    public readonly detail?: Readonly<{
      status?: number;
      retryAfterSeconds?: number | null;
    }>,
  ) {
    super(message);
    this.name = "RegistryProviderError";
  }
}

export type RegistryAdoptionFetchResult = Readonly<{
  packageName: string;
  weeklyDownloads: number | null;
  downloadsDelta7d: number | null;
  downloadsDelta30d: number | null;
  lastPublishedAt: string | null;
  latestVersion: string | null;
}>;

export interface RegistryProviderPort {
  readonly source: RegistrySource;
  fetchPackageAdoption(
    packageName: string,
  ): Promise<RegistryAdoptionFetchResult>;
}
