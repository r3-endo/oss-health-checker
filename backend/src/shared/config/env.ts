import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  GITHUB_API_BASE_URL: z.string().url().default("https://api.github.com"),
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1).default("file:./local.db"),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  NPM_REGISTRY_API_BASE_URL: z
    .string()
    .url()
    .default("https://registry.npmjs.org"),
  NPM_DOWNLOADS_API_BASE_URL: z
    .string()
    .url()
    .default("https://api.npmjs.org/downloads"),
  NPM_REGISTRY_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  ADOPTION_ENABLED_SOURCES: z
    .string()
    .default("npm")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
});

export type AppEnv = Readonly<z.infer<typeof EnvSchema>>;

export const env: AppEnv = Object.freeze(EnvSchema.parse(process.env));
