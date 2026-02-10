import type { AppEnv } from "../../config/env";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type DrizzleDatabaseHandle = Readonly<{
  kind: "drizzle";
  databaseUrl: string;
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle<typeof schema>>;
}>;

const resolveSqlitePath = (databaseUrl: string): string =>
  databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : databaseUrl;

export const createDrizzleHandle = (
  env: Pick<AppEnv, "DATABASE_URL">,
): DrizzleDatabaseHandle =>
  {
    const sqlitePath = resolveSqlitePath(env.DATABASE_URL);
    const sqlite = new Database(sqlitePath);
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("busy_timeout = 5000");

    const db = drizzle(sqlite, { schema });

    return Object.freeze({
      kind: "drizzle",
      databaseUrl: env.DATABASE_URL,
      sqlite,
      db,
    });
  };
