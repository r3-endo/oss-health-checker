import type { AppEnv } from "../../config/env";

// NOTE: database adapter is intentionally abstract here.
// We keep connection details behind an immutable handle so DB can be swapped later.
export type DrizzleDatabaseHandle = Readonly<{
  kind: "drizzle";
  databaseUrl: string;
}>;

export const createDrizzleHandle = (
  env: Pick<AppEnv, "DATABASE_URL">,
): DrizzleDatabaseHandle =>
  Object.freeze({
    kind: "drizzle",
    databaseUrl: env.DATABASE_URL,
  });
