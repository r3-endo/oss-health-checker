import { Hono } from "hono";
import type { AppContainer } from "./build-container";
import { createRepositoryRoutes } from "../interface/http/routes/repository-routes";

export const buildApp = (container: AppContainer): Hono => {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/api", createRepositoryRoutes(container.repositoryController));

  return app;
};
