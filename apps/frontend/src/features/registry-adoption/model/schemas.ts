import { z } from "zod";
import { RepositoryAdoptionSchema } from "../../ecosystem-adoption/model/schemas";

export const RepositoryStatusSchema = z.enum(["Active", "Stale", "Risky"]);

export const RegistryRepositorySchema = z.object({
  id: z.string(),
  url: z.url(),
  owner: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const RegistrySnapshotSchema = z.object({
  repositoryId: z.string(),
  lastCommitAt: z.iso.datetime(),
  lastReleaseAt: z.iso.datetime().nullable(),
  openIssuesCount: z.number().int().nonnegative(),
  contributorsCount: z.number().int().nonnegative(),
  status: RepositoryStatusSchema,
  warningReasons: z.array(z.string()),
  fetchedAt: z.iso.datetime(),
});

export const RegistryAdoptionRowSchema = z.object({
  repository: RegistryRepositorySchema,
  snapshot: RegistrySnapshotSchema.nullable(),
  adoption: RepositoryAdoptionSchema,
});

export const RegistryAdoptionListResponseSchema = z.object({
  data: z.array(RegistryAdoptionRowSchema),
});

export type RegistryAdoptionRow = z.infer<typeof RegistryAdoptionRowSchema>;
