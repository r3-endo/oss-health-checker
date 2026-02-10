import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  GITHUB_API_BASE_URL: z.string().url().default("https://api.github.com"),
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1).default("file:./local.db"),
});

export type AppEnv = Readonly<z.infer<typeof EnvSchema>>;

export const env: AppEnv = Object.freeze(EnvSchema.parse(process.env));
