export type RepositorySignals = Readonly<{
  lastCommitAt: Date;
  lastReleaseAt: Date | null;
  openIssuesCount: number;
  contributorsCount: number;
}>;

export interface RepositoryGatewayPort {
  fetchSignals(owner: string, name: string): Promise<RepositorySignals>;
}
