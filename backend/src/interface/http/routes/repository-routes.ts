import { Hono } from "hono";
import { RepositoryController } from "../controllers/repository-controller";

export const createRepositoryRoutes = (
  controller: RepositoryController,
): Hono => {
  const route = new Hono();

  route.post("/repositories", controller.create);
  route.get("/repositories", controller.list);
  route.post("/repositories/:id/refresh", controller.refresh);

  return route;
};
