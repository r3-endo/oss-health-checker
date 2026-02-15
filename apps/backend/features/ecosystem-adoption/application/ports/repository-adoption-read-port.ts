import type { RepositoryAdoption } from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";

export interface RepositoryAdoptionReadPort {
  getByRepositoryId(repositoryId: string): Promise<RepositoryAdoption>;
}
