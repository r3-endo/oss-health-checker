import { randomUUID } from "node:crypto";
import type { RepositoryPort } from "@oss-health-checker/common/features/development-health/application/ports/repository-port.js";
import { ApplicationError } from "@oss-health-checker/common/features/ecosystem-adoption/application/errors/application-error.js";
import type { AdoptionSnapshotPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/adoption-snapshot-port.js";
import type { RegistryProviderResolverPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-resolver-port.js";
import { RegistryProviderError } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-port.js";
import type { RepositoryPackageMappingPort } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/repository-package-mapping-port.js";
import type { RepositoryAdoptionView } from "../read-models/repository-adoption-view.js";

export type RefreshRepositoryAdoptionInput = Readonly<{
  repositoryId: string;
}>;

export interface RefreshRepositoryAdoptionUseCase {
  execute(
    input: RefreshRepositoryAdoptionInput,
  ): Promise<RepositoryAdoptionView>;
}

export class RefreshRepositoryAdoptionService implements RefreshRepositoryAdoptionUseCase {
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly mappingPort: RepositoryPackageMappingPort,
    private readonly snapshotPort: AdoptionSnapshotPort,
    private readonly resolverPort: RegistryProviderResolverPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: RefreshRepositoryAdoptionInput,
  ): Promise<RepositoryAdoptionView> {
    const repository = await this.repositoryPort.findById(input.repositoryId);
    if (!repository) {
      throw new ApplicationError("NOT_FOUND", "Repository not found");
    }

    const mapping = await this.mappingPort.findByRepositoryId(repository.id);
    if (!mapping) {
      return Object.freeze({
        mappingStatus: "not_mapped",
        adoptionFetchStatus: "not_applicable",
        packageName: null,
        weeklyDownloads: null,
        downloadsDelta7d: null,
        downloadsDelta30d: null,
        lastPublishedAt: null,
        latestVersion: null,
        deprecated: null,
        fetchedAt: null,
        source: null,
      });
    }

    const provider = this.resolverPort.resolve(mapping.source);
    if (!provider) {
      const latest = await this.snapshotPort.findLatestByRepositoryId(
        repository.id,
      );
      return Object.freeze({
        mappingStatus: "mapped",
        adoptionFetchStatus: "failed",
        packageName: latest?.packageName ?? mapping.packageName,
        weeklyDownloads: latest?.weeklyDownloads ?? null,
        downloadsDelta7d: latest?.downloadsDelta7d ?? null,
        downloadsDelta30d: latest?.downloadsDelta30d ?? null,
        lastPublishedAt: latest?.lastPublishedAt ?? null,
        latestVersion: latest?.latestVersion ?? null,
        deprecated: latest?.deprecated ?? null,
        fetchedAt: latest ? latest.fetchedAt.toISOString() : null,
        source: mapping.source,
      });
    }

    try {
      const adopted = await provider.fetchPackageAdoption(mapping.packageName);
      const fetchedAt = this.now();
      const saved = await this.snapshotPort.save({
        repositoryId: repository.id,
        source: mapping.source,
        packageName: adopted.packageName,
        weeklyDownloads: adopted.weeklyDownloads,
        downloadsDelta7d: adopted.downloadsDelta7d,
        downloadsDelta30d: adopted.downloadsDelta30d,
        lastPublishedAt: adopted.lastPublishedAt,
        latestVersion: adopted.latestVersion,
        deprecated: adopted.deprecated,
        fetchStatus: "succeeded",
        fetchedAt,
      });
      return Object.freeze({
        mappingStatus: "mapped",
        adoptionFetchStatus: "succeeded",
        packageName: saved.packageName,
        weeklyDownloads: saved.weeklyDownloads,
        downloadsDelta7d: saved.downloadsDelta7d,
        downloadsDelta30d: saved.downloadsDelta30d,
        lastPublishedAt: saved.lastPublishedAt,
        latestVersion: saved.latestVersion,
        deprecated: saved.deprecated,
        fetchedAt: saved.fetchedAt.toISOString(),
        source: saved.source,
      });
    } catch (error: unknown) {
      if (error instanceof RegistryProviderError) {
        const previous = await this.snapshotPort.findLatestByRepositoryId(
          repository.id,
        );
        const fetchedAt = this.now();

        const saved = await this.snapshotPort.save({
          repositoryId: repository.id,
          source: mapping.source,
          packageName: previous?.packageName ?? mapping.packageName,
          weeklyDownloads: previous?.weeklyDownloads ?? null,
          downloadsDelta7d: previous?.downloadsDelta7d ?? null,
          downloadsDelta30d: previous?.downloadsDelta30d ?? null,
          lastPublishedAt: previous?.lastPublishedAt ?? null,
          latestVersion: previous?.latestVersion ?? null,
          deprecated: previous?.deprecated ?? null,
          fetchStatus: "failed",
          fetchedAt,
        });

        return Object.freeze({
          mappingStatus: "mapped",
          adoptionFetchStatus: "failed",
          packageName: saved.packageName,
          weeklyDownloads: saved.weeklyDownloads,
          downloadsDelta7d: saved.downloadsDelta7d,
          downloadsDelta30d: saved.downloadsDelta30d,
          lastPublishedAt: saved.lastPublishedAt,
          latestVersion: saved.latestVersion,
          deprecated: saved.deprecated,
          fetchedAt: saved.fetchedAt.toISOString(),
          source: saved.source,
        });
      }

      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError(
        "INTERNAL_ERROR",
        "Failed to refresh adoption",
        {
          cause: error instanceof Error ? error.message : "unknown",
        },
      );
    }
  }
}

export const createAdoptionSnapshotId = (): string => randomUUID();
