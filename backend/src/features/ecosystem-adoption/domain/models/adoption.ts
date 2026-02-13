import { z } from "zod";

export const REGISTRY_SOURCES = [
  "npm",
  "maven-central",
  "pypi",
  "homebrew",
  "docker",
] as const;

export type RegistrySource = (typeof REGISTRY_SOURCES)[number];

export const MAPPING_STATUSES = ["mapped", "not_mapped"] as const;
export type MappingStatus = (typeof MAPPING_STATUSES)[number];

export const ADOPTION_FETCH_STATUSES = [
  "succeeded",
  "failed",
  "not_applicable",
] as const;
export type AdoptionFetchStatus = (typeof ADOPTION_FETCH_STATUSES)[number];

const AdoptionValueFieldsSchema = z.object({
  packageName: z.string().nullable(),
  weeklyDownloads: z.number().int().nonnegative().nullable(),
  downloadsDelta7d: z.number().int().nullable(),
  downloadsDelta30d: z.number().int().nullable(),
  lastPublishedAt: z.string().datetime().nullable(),
  latestVersion: z.string().nullable(),
  deprecated: z.boolean().nullable(),
});

export const AdoptionMappedSucceededSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("mapped"),
  adoptionFetchStatus: z.literal("succeeded"),
  fetchedAt: z.string().datetime(),
  source: z.enum(REGISTRY_SOURCES),
});

export const AdoptionMappedFailedSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("mapped"),
  adoptionFetchStatus: z.literal("failed"),
  fetchedAt: z.string().datetime().nullable(),
  source: z.enum(REGISTRY_SOURCES),
});

export const AdoptionNotMappedSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("not_mapped"),
  adoptionFetchStatus: z.literal("not_applicable"),
  fetchedAt: z.null(),
  source: z.null(),
});

export const RepositoryAdoptionSchema = z.union([
  AdoptionMappedSucceededSchema,
  AdoptionMappedFailedSchema,
  AdoptionNotMappedSchema,
]);

export type RepositoryAdoption = z.infer<typeof RepositoryAdoptionSchema>;

export type RepositoryPackageMapping = Readonly<{
  repositoryId: string;
  source: RegistrySource;
  packageName: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AdoptionSnapshot = Readonly<{
  id: string;
  repositoryId: string;
  source: RegistrySource;
  packageName: string;
  weeklyDownloads: number | null;
  downloadsDelta7d: number | null;
  downloadsDelta30d: number | null;
  lastPublishedAt: string | null;
  latestVersion: string | null;
  deprecated: boolean | null;
  fetchStatus: Extract<AdoptionFetchStatus, "succeeded" | "failed">;
  fetchedAt: Date;
}>;
