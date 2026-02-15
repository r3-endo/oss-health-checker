import { z } from "@hono/zod-openapi";
import {
  ADOPTION_FETCH_STATUSES,
  MAPPING_STATUSES,
  REGISTRY_SOURCES,
} from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";
import { type ApplicationErrorCode } from "@oss-health-checker/common/features/ecosystem-adoption/application/errors/application-error.js";

const registrySourceValues = [...REGISTRY_SOURCES] as [
  (typeof REGISTRY_SOURCES)[number],
  ...(typeof REGISTRY_SOURCES)[number][],
];

const mappingStatusValues = [...MAPPING_STATUSES] as [
  (typeof MAPPING_STATUSES)[number],
  ...(typeof MAPPING_STATUSES)[number][],
];

const adoptionFetchStatusValues = [...ADOPTION_FETCH_STATUSES] as [
  (typeof ADOPTION_FETCH_STATUSES)[number],
  ...(typeof ADOPTION_FETCH_STATUSES)[number][],
];

const AdoptionValueFieldsSchema = z.object({
  packageName: z.string().nullable(),
  weeklyDownloads: z.number().int().nonnegative().nullable(),
  downloadsDelta7d: z.number().int().nullable(),
  downloadsDelta30d: z.number().int().nullable(),
  lastPublishedAt: z.string().datetime().nullable(),
  latestVersion: z.string().nullable(),
});

export const AdoptionMappedSucceededSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("mapped"),
  adoptionFetchStatus: z.literal("succeeded"),
  source: z.enum(registrySourceValues),
  fetchedAt: z.string().datetime(),
});

export const AdoptionMappedFailedSchema = AdoptionValueFieldsSchema.extend({
  mappingStatus: z.literal("mapped"),
  adoptionFetchStatus: z.literal("failed"),
  source: z.enum(registrySourceValues),
  fetchedAt: z.string().datetime().nullable(),
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

export const RefreshRepositoryAdoptionParamsSchema = z.object({
  id: z.string().min(1),
});

export const RefreshRepositoryAdoptionResponseSchema = z.object({
  data: z.object({
    adoption: RepositoryAdoptionSchema,
  }),
});

export const AdoptionStatusSchema = z.object({
  mappingStatus: z.enum(mappingStatusValues),
  adoptionFetchStatus: z.enum(adoptionFetchStatusValues),
});

const createErrorResponseSchema = (
  code: ApplicationErrorCode,
): z.ZodObject<{
  error: z.ZodObject<{
    code: z.ZodLiteral<ApplicationErrorCode>;
    message: z.ZodString;
    detail: z.ZodNullable<
      z.ZodOptional<
        z.ZodObject<{
          reason: z.ZodOptional<z.ZodString>;
          limit: z.ZodOptional<z.ZodNumber>;
          status: z.ZodOptional<z.ZodNumber>;
          retryAfterSeconds: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
          cause: z.ZodOptional<z.ZodString>;
        }>
      >
    >;
  }>;
}> =>
  z.object({
    error: z.object({
      code: z.literal(code),
      message: z.string(),
      detail: z
        .object({
          reason: z.string().optional(),
          limit: z.number().int().optional(),
          status: z.number().int().optional(),
          retryAfterSeconds: z.number().int().nullable().optional(),
          cause: z.string().optional(),
        })
        .optional()
        .nullable(),
    }),
  });

export const ValidationErrorResponseSchema =
  createErrorResponseSchema("VALIDATION_ERROR");
export const NotFoundErrorResponseSchema =
  createErrorResponseSchema("NOT_FOUND");
export const RateLimitErrorResponseSchema =
  createErrorResponseSchema("RATE_LIMIT");
export const ExternalApiErrorResponseSchema =
  createErrorResponseSchema("EXTERNAL_API_ERROR");
export const InternalErrorResponseSchema =
  createErrorResponseSchema("INTERNAL_ERROR");
