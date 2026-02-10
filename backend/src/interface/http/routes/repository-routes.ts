import { Hono } from "hono";
import { RepositoryController } from "../controllers/repository-controller";

export const createRepositoryRoutes = (
  controller: RepositoryController,
): Hono => {
  const route = new Hono();

  route.get("/repositories", controller.list);

  return route;
};
