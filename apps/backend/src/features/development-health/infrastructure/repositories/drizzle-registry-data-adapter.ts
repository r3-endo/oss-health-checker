import { desc, eq } from "drizzle-orm";
import type { RegistryDataPort } from "../../application/ports/registry-data-port.js";
import type { RegistryData } from "../../application/ports/registry-data-port.js";
import type { DrizzleDatabaseHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import {
  repositoryPackageMappingsTable,
  adoptionSnapshotsTable,
} from "@oss-health-checker/common/shared/infrastructure/db/drizzle/schema.js";

export class DrizzleRegistryDataAdapter implements RegistryDataPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async findLatestByRepositoryId(
    repositoryId: string,
  ): Promise<RegistryData | null> {
    const mapping = this.db.db
      .select()
      .from(repositoryPackageMappingsTable)
      .where(eq(repositoryPackageMappingsTable.repositoryId, repositoryId))
      .get();

    if (!mapping) {
      return null;
    }

    const snapshot = this.db.db
      .select()
      .from(adoptionSnapshotsTable)
      .where(eq(adoptionSnapshotsTable.repositoryId, repositoryId))
      .orderBy(
        desc(adoptionSnapshotsTable.fetchedAt),
        desc(adoptionSnapshotsTable.id),
      )
      .get();

    if (!snapshot) {
      return null;
    }

    return Object.freeze({
      packageName: snapshot.packageName,
      source: snapshot.source,
      latestVersion: snapshot.latestVersion,
      lastPublishedAt: snapshot.lastPublishedAt,
      weeklyDownloads: snapshot.weeklyDownloads,
      deprecated: snapshot.deprecated ?? null,
    });
  }
}
