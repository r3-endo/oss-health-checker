import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { DashboardController } from "../controllers/dashboard-controller.js";
import {
  InternalErrorResponseSchema,
  ListDashboardRepositoriesResponseSchema,
} from "../openapi/schemas.js";

const listDashboardRepositoriesRoute = createRoute({
  method: "get",
  path: "/dashboard/repositories",
  summary: "List dashboard repositories",
  responses: {
    200: {
      description: "Dashboard repository list",
      content: {
        "application/json": {
          schema: ListDashboardRepositoriesResponseSchema,
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

export const createDashboardRoutes = (
  controller: DashboardController,
): OpenAPIHono => {
  const route = new OpenAPIHono();

  route.openapi(listDashboardRepositoriesRoute, async (c) => {
    const payload = await controller.listRepositories();
    return c.json(payload as never, 200);
  });

  return route;
};
