export default {
  schema: "./packages/common/src/shared/infrastructure/db/drizzle/schema.ts",
  out: "./db/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./db/drizzle/dev.sqlite",
  },
};
