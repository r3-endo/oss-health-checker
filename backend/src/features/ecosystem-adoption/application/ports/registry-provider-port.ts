export type RegistrySource =
  | "npm"
  | "maven-central"
  | "pypi"
  | "homebrew"
  | "docker";

export type RegistryPackageCoordinate = Readonly<{
  ecosystem: RegistrySource;
  packageName: string;
}>;

export type RegistryAdoptionSignal = Readonly<{
  source: RegistrySource;
  packageName: string;
  downloads30d: number | null;
  stars: number | null;
  latestVersion: string | null;
  observedAt: string;
}>;

export interface RegistryProviderPort {
  readonly source: RegistrySource;
  fetchSignals(
    coordinate: RegistryPackageCoordinate,
  ): Promise<readonly RegistryAdoptionSignal[]>;
}
