import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { AdoptionController } from "../controllers/adoption-controller.js";
import {
  ExternalApiErrorResponseSchema,
  InternalErrorResponseSchema,
  NotFoundErrorResponseSchema,
  RateLimitErrorResponseSchema,
  RefreshRepositoryAdoptionParamsSchema,
  RefreshRepositoryAdoptionResponseSchema,
  ValidationErrorResponseSchema,
} from "../openapi/schemas.js";
import { mapErrorToHttp } from "../error-mapper.js";

const refreshRepositoryAdoptionRoute = createRoute({
  method: "post",
  path: "/repositories/{id}/adoption/refresh",
  summary: "Refresh repository adoption snapshot",
  request: {
    params: RefreshRepositoryAdoptionParamsSchema,
  },
  responses: {
    200: {
      description: "Repository adoption refreshed",
      content: {
        "application/json": {
          schema: RefreshRepositoryAdoptionResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Repository not found",
      content: {
        "application/json": {
          schema: NotFoundErrorResponseSchema,
        },
      },
    },
    429: {
      description: "Rate limited",
      content: {
        "application/json": {
          schema: RateLimitErrorResponseSchema,
        },
      },
    },
    502: {
      description: "External API failure",
      content: {
        "application/json": {
          schema: ExternalApiErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal error",
      content: {
        "application/json": {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const createAdoptionRoutes = (
  controller: AdoptionController,
): OpenAPIHono => {
  const route = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request",
              detail: null,
            },
          },
          400,
        );
      }
    },
  });

  route.openapi(refreshRepositoryAdoptionRoute, async (c) => {
    const params = c.req.valid("param");

    try {
      const payload = await controller.refresh({ repositoryId: params.id });
      return c.json(payload as never, 200);
    } catch (error) {
      return mapErrorToHttp(c, error) as never;
    }
  });

  return route;
};
