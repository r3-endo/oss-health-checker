export type RepositorySignals = Readonly<{
  lastCommitAt: Date;
  lastReleaseAt: Date | null;
  openIssuesCount: number;
  contributorsCount: number;
}>;

export type RepositoryGatewayErrorCode = "RATE_LIMIT" | "API_ERROR";

export class RepositoryGatewayError extends Error {
  constructor(
    public readonly code: RepositoryGatewayErrorCode,
    message: string,
    public readonly detail?: Readonly<{
      status?: number;
      retryAfterSeconds?: number | null;
      cause?: unknown;
    }>,
  ) {
    super(message);
    this.name = "RepositoryGatewayError";
  }
}

export interface RepositoryGatewayPort {
  fetchSignals(owner: string, name: string): Promise<RepositorySignals>;
}
