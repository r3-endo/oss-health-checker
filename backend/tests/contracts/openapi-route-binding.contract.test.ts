import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { createRepositoryRoutes } from "../../src/interface/http/routes/repository-routes";

const createContractApp = (): Hono => {
  const app = new Hono();
  const controller = {
    create: async (c: Context) => c.json({ data: { ok: true } }, 201),
    list: async (c: Context) => c.json({ data: [] }),
    refresh: async (c: Context) => c.json({ data: { ok: true } }),
  };

  app.route("/api", createRepositoryRoutes(controller as never));
  return app;
};

describe("openapi route binding contract baseline", () => {
  it("exposes the three repository endpoints used by the runtime contract", async () => {
    const app = createContractApp();

    const createResponse = await app.request("/api/repositories", {
      method: "POST",
    });
    const listResponse = await app.request("/api/repositories", {
      method: "GET",
    });
    const refreshResponse = await app.request("/api/repositories/r1/refresh", {
      method: "POST",
    });

    expect(createResponse.status).toBe(201);
    expect(listResponse.status).toBe(200);
    expect(refreshResponse.status).toBe(200);
  });

  it.todo(
    "[RED][openapi-runtime-contract-binding] route-level OpenAPI binding must fail when runtime endpoint is not contract-bound",
  );
});
