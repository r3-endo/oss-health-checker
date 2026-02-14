import type { RepositoryAdoptionReadPort } from "../ports/repository-adoption-read-port.js";
import type { RepositoryAdoption } from "../../domain/models/adoption.js";

export interface GetRepositoryAdoptionUseCase {
  execute(input: { repositoryId: string }): Promise<RepositoryAdoption>;
}

export class GetRepositoryAdoptionService implements GetRepositoryAdoptionUseCase {
  constructor(
    private readonly repositoryAdoptionReadPort: RepositoryAdoptionReadPort,
  ) {}

  async execute(input: { repositoryId: string }): Promise<RepositoryAdoption> {
    return this.repositoryAdoptionReadPort.getByRepositoryId(
      input.repositoryId,
    );
  }
}
