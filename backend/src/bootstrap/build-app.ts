import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { AppContainer } from "./build-container.js";
import { createRepositoryRoutes } from "../interface/http/routes/repository-routes.js";
import { mapErrorToHttp } from "../interface/http/error-mapper.js";

export const buildApp = (container: AppContainer): OpenAPIHono => {
  const app = new OpenAPIHono();

  app.use("/api/*", secureHeaders());
  app.use(
    "/api/*",
    cors({
      origin: [...container.corsAllowedOrigins],
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
  app.doc("/api/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "OSS Health Checker Backend API",
      version: "0.1.0",
    },
  });

  return app;
};
