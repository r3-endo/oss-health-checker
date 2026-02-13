import { z } from "@hono/zod-openapi";
import {
  RepositorySchema,
  RepositorySnapshotSchema,
  InternalErrorResponseSchema,
} from "../../../../development-health/interface/http/openapi/schemas.js";
import { RepositoryAdoptionSchema } from "../../../../ecosystem-adoption/interface/http/openapi/schemas.js";

export const DashboardRepositoryRowSchema = z.object({
  repository: RepositorySchema,
  snapshot: RepositorySnapshotSchema.nullable(),
  adoption: RepositoryAdoptionSchema,
});

export const ListDashboardRepositoriesResponseSchema = z.object({
  data: z.array(DashboardRepositoryRowSchema),
});

export { InternalErrorResponseSchema };
