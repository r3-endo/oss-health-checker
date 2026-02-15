import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleRepositoryReadModelAdapter } from "@backend/src/features/development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.js";
import { DrizzleRepositoryPackageMappingAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-package-mapping-adapter.js";
import { DrizzleAdoptionSnapshotAdapter } from "@oss-health-checker/common/features/ecosystem-adoption/infrastructure/repositories/drizzle-adoption-snapshot-adapter.js";
import { DrizzleRepositoryAdoptionReadAdapter } from "@backend/src/features/ecosystem-adoption/infrastructure/repositories/drizzle-repository-adoption-read-adapter.js";
import { ListDashboardRepositoriesService } from "@backend/src/features/dashboard-overview/application/use-cases/list-dashboard-repositories-use-case.js";

describe("dashboard overview integration", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(async () => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "dashboard-overview-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);

    db.sqlite
      .prepare(
        "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("repo-1", "https://github.com/acme/repo-1", "acme", "repo-1", 1, 1);
    db.sqlite
      .prepare(
        "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("repo-2", "https://github.com/acme/repo-2", "acme", "repo-2", 2, 2);
    db.sqlite
      .prepare(
        "INSERT INTO repositories (id, url, owner, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("repo-3", "https://github.com/acme/repo-3", "acme", "repo-3", 3, 3);

    db.sqlite
      .prepare(
        "INSERT INTO snapshots (id, repository_id, last_commit_at, last_release_at, open_issues_count, contributors_count, status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run("snap-1", "repo-1", 10, null, 1, 1, "Active", 10);

    db.sqlite
      .prepare(
        "INSERT INTO snapshots (id, repository_id, last_commit_at, last_release_at, open_issues_count, contributors_count, status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run("snap-2", "repo-2", 11, null, 2, 2, "Stale", 11);

    db.sqlite
      .prepare(
        "INSERT INTO repository_package_mappings (repository_id, source, package_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("repo-1", "npm", "pkg-1", 1, 1);
    db.sqlite
      .prepare(
        "INSERT INTO repository_package_mappings (repository_id, source, package_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("repo-2", "npm", "pkg-2", 1, 1);

    db.sqlite
      .prepare(
        "INSERT INTO adoption_snapshots (id, repository_id, source, package_name, weekly_downloads, downloads_delta_7d, downloads_delta_30d, last_published_at, latest_version, fetch_status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        "adp-1",
        "repo-1",
        "npm",
        "pkg-1",
        1000,
        10,
        30,
        null,
        "1.0.0",
        "succeeded",
        10,
      );
    db.sqlite
      .prepare(
        "INSERT INTO adoption_snapshots (id, repository_id, source, package_name, weekly_downloads, downloads_delta_7d, downloads_delta_30d, last_published_at, latest_version, fetch_status, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        "adp-2",
        "repo-2",
        "npm",
        "pkg-2",
        500,
        null,
        null,
        null,
        "0.9.0",
        "failed",
        11,
      );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns integrated rows with all adoption states and dev-health snapshot fields", async () => {
    const repositoryRead = new DrizzleRepositoryReadModelAdapter(db);
    const mapping = new DrizzleRepositoryPackageMappingAdapter(db);
    const adoptionSnapshot = new DrizzleAdoptionSnapshotAdapter(db);
    const adoptionRead = new DrizzleRepositoryAdoptionReadAdapter(
      mapping,
      adoptionSnapshot,
    );
    const service = new ListDashboardRepositoriesService(
      repositoryRead,
      adoptionRead,
    );

    const rows = await service.execute();
    const byId = new Map(rows.map((row) => [row.repository.id, row] as const));

    expect(byId.get("repo-1")?.snapshot?.status).toBe("Active");
    expect(byId.get("repo-1")?.adoption).toMatchObject({
      mappingStatus: "mapped",
      adoptionFetchStatus: "succeeded",
      packageName: "pkg-1",
    });

    expect(byId.get("repo-2")?.snapshot?.status).toBe("Stale");
    expect(byId.get("repo-2")?.adoption).toMatchObject({
      mappingStatus: "mapped",
      adoptionFetchStatus: "failed",
      packageName: "pkg-2",
    });

    expect(byId.get("repo-3")?.snapshot).toBeNull();
    expect(byId.get("repo-3")?.adoption).toMatchObject({
      mappingStatus: "not_mapped",
      adoptionFetchStatus: "not_applicable",
    });
  });
});
