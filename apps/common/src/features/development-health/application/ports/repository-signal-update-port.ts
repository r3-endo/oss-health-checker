export type SignalUpdateResult = Readonly<{
  repositoryId: string;
  updated: boolean;
}>;

export interface RepositorySignalUpdatePort {
  refreshByRepositoryId(repositoryId: string): Promise<SignalUpdateResult>;
  refreshAll(): Promise<readonly SignalUpdateResult[]>;
}
