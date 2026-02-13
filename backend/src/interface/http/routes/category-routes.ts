import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  CategoryDetailResponseSchema,
  CategoryNotFoundErrorResponseSchema,
  CategorySlugParamSchema,
  ListCategoriesResponseSchema,
} from "../openapi/category-schemas.js";
import { mapCategoryErrorToHttp } from "../error-mapper.js";

export type CategoryController = {
  listCategories: () => Promise<{ data: unknown }>;
  getCategoryDetail: (params: { slug: string }) => Promise<{ data: unknown }>;
};

const listCategoriesRoute = createRoute({
  method: "get",
  path: "/categories",
  summary: "List categories",
  responses: {
    200: {
      description: "Category summary list",
      content: {
        "application/json": {
          schema: ListCategoriesResponseSchema,
        },
      },
    },
  },
});

const getCategoryDetailRoute = createRoute({
  method: "get",
  path: "/categories/{slug}",
  summary: "Get category detail",
  request: {
    params: CategorySlugParamSchema,
  },
  responses: {
    200: {
      description: "Category detail",
      content: {
        "application/json": {
          schema: CategoryDetailResponseSchema,
        },
      },
    },
    404: {
      description: "Category not found",
      content: {
        "application/json": {
          schema: CategoryNotFoundErrorResponseSchema,
        },
      },
    },
  },
});

export const createCategoryRoutes = (
  controller: CategoryController,
): OpenAPIHono => {
  const route = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "CATEGORY_NOT_FOUND",
              message: "Category not found",
            },
          },
          404,
        );
      }
    },
  });

  route.openapi(listCategoriesRoute, async (c) => {
    const payload = await controller.listCategories();
    return c.json(payload as never, 200);
  });

  route.openapi(getCategoryDetailRoute, async (c) => {
    try {
      const params = c.req.valid("param");
      const payload = await controller.getCategoryDetail({ slug: params.slug });
      return c.json(payload as never, 200);
    } catch (error) {
      const response = mapCategoryErrorToHttp(c, error);
      if (response.status === 404) {
        return response as never;
      }

      throw error;
    }
  });

  return route;
};
