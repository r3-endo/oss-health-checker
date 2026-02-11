import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DrizzleDatabaseHandle } from "./client";

const migrationFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../drizzle",
);

const domainTables = [
  "repositories",
  "snapshots",
  "snapshot_warning_reasons",
] as const;
const migrationTableName = "__drizzle_migrations";

type MigrationMeta = Readonly<{
  tag: string;
  when: number;
}>;

const hasTable = (
  handle: DrizzleDatabaseHandle,
  tableName: string,
): boolean => {
  const row = handle.sqlite
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    )
    .get(tableName);
  return row !== undefined;
};

const hasAnyDomainTable = (handle: DrizzleDatabaseHandle): boolean =>
  domainTables.some((tableName) => hasTable(handle, tableName));

const readMigrationJournal = (): readonly MigrationMeta[] => {
  const journalPath = path.join(migrationFolder, "meta", "_journal.json");
  const parsed = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as Readonly<{
    entries: readonly MigrationMeta[];
  }>;
  return parsed.entries;
};

const resolveMigrationHash = (tag: string): string => {
  const sqlPath = path.join(migrationFolder, `${tag}.sql`);
  const sql = fs.readFileSync(sqlPath, "utf-8");
  return crypto.createHash("sha256").update(sql).digest("hex");
};

const ensureLegacyMigrationBaseline = (handle: DrizzleDatabaseHandle): void => {
  const migrationTableExists = hasTable(handle, migrationTableName);
  if (migrationTableExists || !hasAnyDomainTable(handle)) {
    return;
  }

  handle.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ${migrationTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at NUMERIC
    );
  `);

  const insert = handle.sqlite.prepare(
    `INSERT INTO ${migrationTableName} (hash, created_at) VALUES (?, ?)`,
  );
  const entries = readMigrationJournal();
  for (const entry of entries) {
    insert.run(resolveMigrationHash(entry.tag), entry.when);
  }
};

export const migrateDrizzleDatabase = (handle: DrizzleDatabaseHandle): void => {
  ensureLegacyMigrationBaseline(handle);
  migrate(handle.db, { migrationsFolder: migrationFolder });
};
