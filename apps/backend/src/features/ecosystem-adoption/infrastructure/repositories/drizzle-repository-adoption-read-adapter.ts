import type { RepositoryAdoptionReadPort } from "../../application/ports/repository-adoption-read-port.js";
import type { RepositoryPackageMappingPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/repository-package-mapping-port.js";
import type { AdoptionSnapshotPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/adoption-snapshot-port.js";
import type { RepositoryAdoption } from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";

export class DrizzleRepositoryAdoptionReadAdapter implements RepositoryAdoptionReadPort {
  constructor(
    private readonly mappingPort: RepositoryPackageMappingPort,
    private readonly snapshotPort: AdoptionSnapshotPort,
  ) {}

  async getByRepositoryId(repositoryId: string): Promise<RepositoryAdoption> {
    const mapping = await this.mappingPort.findByRepositoryId(repositoryId);

    if (!mapping) {
      return Object.freeze({
        mappingStatus: "not_mapped",
        adoptionFetchStatus: "not_applicable",
        source: null,
        packageName: null,
        weeklyDownloads: null,
        downloadsDelta7d: null,
        downloadsDelta30d: null,
        lastPublishedAt: null,
        latestVersion: null,
        deprecated: null,
        fetchedAt: null,
      });
    }

    const snapshot =
      await this.snapshotPort.findLatestByRepositoryId(repositoryId);

    if (!snapshot) {
      return Object.freeze({
        mappingStatus: "mapped",
        adoptionFetchStatus: "failed",
        source: mapping.source,
        packageName: mapping.packageName,
        weeklyDownloads: null,
        downloadsDelta7d: null,
        downloadsDelta30d: null,
        lastPublishedAt: null,
        latestVersion: null,
        deprecated: null,
        fetchedAt: null,
      });
    }

    return Object.freeze({
      mappingStatus: "mapped",
      adoptionFetchStatus: snapshot.fetchStatus,
      source: snapshot.source,
      packageName: snapshot.packageName,
      weeklyDownloads: snapshot.weeklyDownloads,
      downloadsDelta7d: snapshot.downloadsDelta7d,
      downloadsDelta30d: snapshot.downloadsDelta30d,
      lastPublishedAt: snapshot.lastPublishedAt,
      latestVersion: snapshot.latestVersion,
      deprecated: snapshot.deprecated,
      fetchedAt: snapshot.fetchedAt.toISOString(),
    });
  }
}
