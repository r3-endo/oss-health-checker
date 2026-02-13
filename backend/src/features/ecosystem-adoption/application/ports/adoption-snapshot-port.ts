import type { AdoptionSnapshot } from "../../domain/models/adoption.js";

export interface AdoptionSnapshotPort {
  findLatestByRepositoryId(
    repositoryId: string,
  ): Promise<AdoptionSnapshot | null>;
  save(input: Omit<AdoptionSnapshot, "id">): Promise<AdoptionSnapshot>;
}
