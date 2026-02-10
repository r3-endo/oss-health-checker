import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { AppContainer } from "./build-container";
import { createRepositoryRoutes } from "../interface/http/routes/repository-routes";
import { mapErrorToHttp } from "../interface/http/error-mapper";

export const buildApp = (container: AppContainer): Hono => {
  const app = new Hono();

  app.use("/api/*", secureHeaders());
  app.use(
    "/api/*",
    cors({
      origin: container.corsAllowedOrigins,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.onError((error, c) => mapErrorToHttp(c, error));
  app.notFound((c) =>
    c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Route not found",
          detail: null,
        },
      },
      404,
    ),
  );

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/api", createRepositoryRoutes(container.repositoryController));

  return app;
};
