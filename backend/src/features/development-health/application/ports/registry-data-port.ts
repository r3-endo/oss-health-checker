export type RegistryData = Readonly<{
  packageName: string;
  source: string;
  latestVersion: string | null;
  lastPublishedAt: string | null;
  weeklyDownloads: number | null;
  deprecated: boolean | null;
}>;

export interface RegistryDataPort {
  findLatestByRepositoryId(repositoryId: string): Promise<RegistryData | null>;
}
