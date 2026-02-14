import type { RepositoryAdoption } from "../../domain/models/adoption.js";

export interface RepositoryAdoptionReadPort {
  getByRepositoryId(repositoryId: string): Promise<RepositoryAdoption>;
}
