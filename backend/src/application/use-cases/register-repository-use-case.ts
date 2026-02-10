import type { Repository } from "../../domain/models/repository";
import type { RepositorySnapshot } from "../../domain/models/snapshot";
import type { RepositoryGatewayPort } from "../ports/repository-gateway-port";
import type { RepositoryPort } from "../ports/repository-port";
import type { SnapshotPort } from "../ports/snapshot-port";
import { parseGitHubRepositoryUrl } from "../services/github-repository-url";
import { buildSnapshotFromSignals } from "../services/snapshot-factory";

export type RegisterRepositoryInput = Readonly<{
  url: string;
}>;

export type RegisterRepositoryResult = Readonly<{
  repository: Repository;
  snapshot: RepositorySnapshot;
}>;

export class RegisterRepositoryService {
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly snapshotPort: SnapshotPort,
    private readonly repositoryGatewayPort: RepositoryGatewayPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: RegisterRepositoryInput,
  ): Promise<RegisterRepositoryResult> {
    const parsed = parseGitHubRepositoryUrl(input.url);

    const signals = await this.repositoryGatewayPort.fetchSignals(
      parsed.owner,
      parsed.name,
    );

    const repository = await this.repositoryPort.create({
      url: parsed.normalizedUrl,
      owner: parsed.owner,
      name: parsed.name,
    });

    const snapshot = buildSnapshotFromSignals(
      repository.id,
      signals,
      this.now(),
    );
    await this.snapshotPort.insert(snapshot);

    return Object.freeze({
      repository,
      snapshot,
    });
  }
}
