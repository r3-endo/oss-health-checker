import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../packages/common/src/shared/infrastructure/db/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./drizzle/dev.sqlite",
  },
});
