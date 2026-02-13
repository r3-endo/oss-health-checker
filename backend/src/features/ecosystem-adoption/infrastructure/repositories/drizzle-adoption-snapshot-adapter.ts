import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { AdoptionSnapshotPort } from "../../application/ports/adoption-snapshot-port.js";
import type { AdoptionSnapshot } from "../../domain/models/adoption.js";
import type { DrizzleDatabaseHandle } from "../../../../shared/infrastructure/db/drizzle/client.js";
import { adoptionSnapshotsTable } from "../../../../shared/infrastructure/db/drizzle/schema.js";
import {
  parsePersistedFetchStatus,
  parsePersistedRegistrySource,
} from "./persisted-adoption-validation.js";

const mapRow = (
  row: typeof adoptionSnapshotsTable.$inferSelect,
): AdoptionSnapshot =>
  Object.freeze({
    id: row.id,
    repositoryId: row.repositoryId,
    source: parsePersistedRegistrySource(row.source),
    packageName: row.packageName,
    weeklyDownloads: row.weeklyDownloads,
    downloadsDelta7d: row.downloadsDelta7d,
    downloadsDelta30d: row.downloadsDelta30d,
    lastPublishedAt: row.lastPublishedAt,
    latestVersion: row.latestVersion,
    fetchStatus: parsePersistedFetchStatus(row.fetchStatus),
    fetchedAt: row.fetchedAt,
  });

export class DrizzleAdoptionSnapshotAdapter implements AdoptionSnapshotPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async findLatestByRepositoryId(
    repositoryId: string,
  ): Promise<AdoptionSnapshot | null> {
    const row = this.db.db
      .select()
      .from(adoptionSnapshotsTable)
      .where(eq(adoptionSnapshotsTable.repositoryId, repositoryId))
      .orderBy(
        desc(adoptionSnapshotsTable.fetchedAt),
        desc(adoptionSnapshotsTable.id),
      )
      .get();

    return row ? mapRow(row) : null;
  }

  async save(input: Omit<AdoptionSnapshot, "id">): Promise<AdoptionSnapshot> {
    const id = randomUUID();
    this.db.db
      .insert(adoptionSnapshotsTable)
      .values({
        id,
        repositoryId: input.repositoryId,
        source: input.source,
        packageName: input.packageName,
        weeklyDownloads: input.weeklyDownloads,
        downloadsDelta7d: input.downloadsDelta7d,
        downloadsDelta30d: input.downloadsDelta30d,
        lastPublishedAt: input.lastPublishedAt,
        latestVersion: input.latestVersion,
        fetchStatus: input.fetchStatus,
        fetchedAt: input.fetchedAt,
      })
      .run();

    const row = this.db.db
      .select()
      .from(adoptionSnapshotsTable)
      .where(eq(adoptionSnapshotsTable.id, id))
      .get();

    if (!row) {
      throw new Error("Failed to read inserted adoption snapshot");
    }

    return mapRow(row);
  }
}
