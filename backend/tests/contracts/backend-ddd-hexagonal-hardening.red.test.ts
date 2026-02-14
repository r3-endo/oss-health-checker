import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { UnitOfWorkPort } from "@oss-health-checker/common/features/development-health/application/ports/unit-of-work-port.js";
import { createDrizzleHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import type { DrizzleDatabaseHandle } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/migrate.js";
import { DrizzleUnitOfWorkAdapter } from "@oss-health-checker/common/features/development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.js";
import { repositoriesTable } from "@oss-health-checker/common/shared/infrastructure/db/drizzle/schema.js";
import { count } from "drizzle-orm";

describe("backend-ddd-hexagonal-hardening red cases by capability", () => {
  it.todo(
    "[RED][application-error-contract] refresh failure returns ApplicationError-based HTTP status (429/502/404/500), never 200 error payload",
  );

  describe("[transactional-use-case-boundary]", () => {
    let tempDir: string;
    let db: DrizzleDatabaseHandle;
    let unitOfWork: UnitOfWorkPort;

    beforeEach(() => {
      tempDir = mkdtempSync(path.join(os.tmpdir(), "red-uow-"));
      const databasePath = path.join(tempDir, "test.sqlite");
      db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
      migrateDrizzleDatabase(db);
      unitOfWork = new DrizzleUnitOfWorkAdapter(db);
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it("register repository and snapshot are rolled back atomically on snapshot write failure", async () => {
      await expect(
        unitOfWork.runInTransaction((tx) => {
          tx.repositoryPort.createWithLimit(
            {
              url: "https://github.com/octocat/Hello-World",
              owner: "octocat",
              name: "Hello-World",
            },
            3,
          );
          throw new Error("Simulated snapshot write failure");
        }),
      ).rejects.toThrow("Simulated snapshot write failure");

      const [repoCount] = await db.db
        .select({ value: count() })
        .from(repositoriesTable);
      expect(repoCount?.value).toBe(0);
    });
  });

  it.todo(
    "[RED][openapi-runtime-contract-binding] repository endpoints fail contract verification when request/response/error schema is not route-bound",
  );
  it.todo(
    "[RED][adapter-runtime-type-safety] unknown persisted status/warning reason fails fast with INTERNAL_ERROR mapping",
  );
  it.todo(
    "[RED][drizzle-schema-migration-governance] schema and migration drift check fails with regeneration guidance",
  );
});
