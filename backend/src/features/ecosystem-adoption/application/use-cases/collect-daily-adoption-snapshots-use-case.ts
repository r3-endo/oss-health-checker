import type { RepositoryPort } from "../../../development-health/application/ports/repository-port.js";
import type { AdoptionSnapshotPort } from "../ports/adoption-snapshot-port.js";
import type { RepositoryPackageMappingPort } from "../ports/repository-package-mapping-port.js";
import type { RegistryProviderResolverPort } from "../ports/registry-provider-resolver-port.js";
import { RegistryProviderError } from "../ports/registry-provider-port.js";
import type { RegistrySource } from "../../domain/models/adoption.js";

export type AdoptionCollectionFailure = Readonly<{
  repositoryId: string;
  code: "RATE_LIMIT" | "EXTERNAL_API_ERROR" | "INTERNAL_ERROR";
  message: string;
}>;

export type AdoptionCollectionSkipped = Readonly<{
  repositoryId: string;
  reason: "not_mapped" | "provider_disabled";
}>;

export type DailyAdoptionCollectionResult = Readonly<{
  successes: readonly Readonly<{ repositoryId: string; updated: true }>[];
  failures: readonly AdoptionCollectionFailure[];
  skipped: readonly AdoptionCollectionSkipped[];
}>;

export interface CollectDailyAdoptionSnapshotsUseCase {
  executeAll(): Promise<DailyAdoptionCollectionResult>;
}

export class CollectDailyAdoptionSnapshotsService implements CollectDailyAdoptionSnapshotsUseCase {
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly mappingPort: RepositoryPackageMappingPort,
    private readonly snapshotPort: AdoptionSnapshotPort,
    private readonly resolverPort: RegistryProviderResolverPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private static mapFailure(error: unknown): Readonly<{
    code: AdoptionCollectionFailure["code"];
    message: string;
  }> {
    if (error instanceof RegistryProviderError) {
      return Object.freeze({
        code: error.code === "RATE_LIMIT" ? "RATE_LIMIT" : "EXTERNAL_API_ERROR",
        message: error.message,
      });
    }

    return Object.freeze({
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  private async persistFailedSnapshot(
    repositoryId: string,
    source: RegistrySource,
    packageName: string,
  ): Promise<void> {
    const previous =
      await this.snapshotPort.findLatestByRepositoryId(repositoryId);

    await this.snapshotPort.save({
      repositoryId,
      source,
      packageName: previous?.packageName ?? packageName,
      weeklyDownloads: previous?.weeklyDownloads ?? null,
      downloadsDelta7d: previous?.downloadsDelta7d ?? null,
      downloadsDelta30d: previous?.downloadsDelta30d ?? null,
      lastPublishedAt: previous?.lastPublishedAt ?? null,
      latestVersion: previous?.latestVersion ?? null,
      deprecated: previous?.deprecated ?? null,
      fetchStatus: "failed",
      fetchedAt: this.now(),
    });
  }

  async executeAll(): Promise<DailyAdoptionCollectionResult> {
    const repositories = await this.repositoryPort.list();
    const successes: Array<Readonly<{ repositoryId: string; updated: true }>> =
      [];
    const failures: AdoptionCollectionFailure[] = [];
    const skipped: AdoptionCollectionSkipped[] = [];

    for (const repository of repositories) {
      const mapping = await this.mappingPort.findByRepositoryId(repository.id);
      if (!mapping) {
        skipped.push({
          repositoryId: repository.id,
          reason: "not_mapped",
        });
        continue;
      }

      const provider = this.resolverPort.resolve(mapping.source);
      if (!provider) {
        skipped.push({
          repositoryId: repository.id,
          reason: "provider_disabled",
        });
        continue;
      }

      try {
        const adopted = await provider.fetchPackageAdoption(
          mapping.packageName,
        );
        await this.snapshotPort.save({
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
          fetchedAt: this.now(),
        });

        successes.push({
          repositoryId: repository.id,
          updated: true,
        });
      } catch (error) {
        const failure = CollectDailyAdoptionSnapshotsService.mapFailure(error);

        try {
          await this.persistFailedSnapshot(
            repository.id,
            mapping.source,
            mapping.packageName,
          );
        } catch {
          // Persist failure should not hide the original provider failure.
        }

        failures.push({
          repositoryId: repository.id,
          code: failure.code,
          message: failure.message,
        });
      }
    }

    return Object.freeze({
      successes,
      failures,
      skipped,
    });
  }
}
