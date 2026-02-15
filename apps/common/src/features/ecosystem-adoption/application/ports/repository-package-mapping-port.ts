import type { RepositoryPackageMapping } from "../../domain/models/adoption.js";

export interface RepositoryPackageMappingPort {
  findByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryPackageMapping | null>;
  upsert(input: {
    repositoryId: string;
    source: RepositoryPackageMapping["source"];
    packageName: string;
    now: Date;
  }): Promise<RepositoryPackageMapping>;
}
