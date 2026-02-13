import { z } from "zod";

export const RegistrySourceSchema = z.enum([
  "npm",
  "maven-central",
  "pypi",
  "homebrew",
  "docker",
]);

const AdoptionValueFieldsSchema = z.object({
  packageName: z.string().nullable(),
  weeklyDownloads: z.number().int().nonnegative().nullable(),
  downloadsDelta7d: z.number().int().nullable(),
  downloadsDelta30d: z.number().int().nullable(),
  lastPublishedAt: z.iso.datetime().nullable(),
  latestVersion: z.string().nullable(),
});

export const AdoptionMappedSucceededSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("mapped"),
  adoptionFetchStatus: z.literal("succeeded"),
  source: RegistrySourceSchema,
  fetchedAt: z.iso.datetime(),
});

export const AdoptionMappedFailedSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("mapped"),
  adoptionFetchStatus: z.literal("failed"),
  source: RegistrySourceSchema,
  fetchedAt: z.iso.datetime().nullable(),
});

export const AdoptionNotMappedSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("not_mapped"),
  adoptionFetchStatus: z.literal("not_applicable"),
  source: z.null(),
  fetchedAt: z.null(),
});

export const RepositoryAdoptionSchema = z.union([
  AdoptionMappedSucceededSchema,
  AdoptionMappedFailedSchema,
  AdoptionNotMappedSchema,
]);

export type RepositoryAdoption = z.infer<typeof RepositoryAdoptionSchema>;
