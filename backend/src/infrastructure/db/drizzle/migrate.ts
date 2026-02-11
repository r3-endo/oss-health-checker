import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DrizzleDatabaseHandle } from "./client";

const migrationFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../drizzle",
);

export const migrateDrizzleDatabase = (handle: DrizzleDatabaseHandle): void => {
  migrate(handle.db, { migrationsFolder: migrationFolder });
};
