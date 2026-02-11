import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { RepositoryController } from "../controllers/repository-controller";
import {
  ExternalApiErrorResponseSchema,
  InternalErrorResponseSchema,
  ListRepositoriesResponseSchema,
  NotFoundErrorResponseSchema,
  RateLimitErrorResponseSchema,
  RefreshRepositoryParamsSchema,
  RefreshRepositoryResponseSchema,
  RegisterRepositoryRequestSchema,
  RegisterRepositoryResponseSchema,
  ValidationErrorResponseSchema,
} from "../openapi/schemas";

const createRepositoryRoute = createRoute({
  method: "post",
  path: "/repositories",
  summary: "Register repository",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterRepositoryRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Repository and initial snapshot created",
      content: {
        "application/json": {
          schema: RegisterRepositoryResponseSchema,
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

const listRepositoriesRoute = createRoute({
  method: "get",
  path: "/repositories",
  summary: "List repositories",
  responses: {
    200: {
      description: "Repository list",
      content: {
        "application/json": {
          schema: ListRepositoriesResponseSchema,
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

const refreshRepositoryRoute = createRoute({
  method: "post",
  path: "/repositories/{id}/refresh",
  summary: "Refresh repository snapshot",
  request: {
    params: RefreshRepositoryParamsSchema,
  },
  responses: {
    200: {
      description: "Repository refreshed",
      content: {
        "application/json": {
          schema: RefreshRepositoryResponseSchema,
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

export const createRepositoryRoutes = (
  controller: RepositoryController,
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

  route.openapi(createRepositoryRoute, async (c) => {
    const input = c.req.valid("json");
    const payload = await controller.create(input);
    return c.json(payload as never, 201);
  });

  route.openapi(listRepositoriesRoute, async (c) => {
    const payload = await controller.list();
    return c.json(payload as never, 200);
  });

  route.openapi(refreshRepositoryRoute, async (c) => {
    const params = c.req.valid("param");
    const payload = await controller.refresh({ repositoryId: params.id });
    return c.json(payload as never, 200);
  });

  return route;
};
