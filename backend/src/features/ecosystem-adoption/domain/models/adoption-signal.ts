export type AdoptionSignal = Readonly<{
  source: "npm" | "maven-central" | "pypi" | "homebrew" | "docker";
  packageName: string;
  downloads30d: number | null;
  observedAt: string;
}>;
