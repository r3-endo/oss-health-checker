import { describe, expect, it } from "vitest";
import { HttpRepositoryApiAdapter } from "../../src/features/repositories/api/repository-api-adapter";
import { buildRepositoryApi } from "../../src/app/repository-api-factory";

describe("buildRepositoryApi", () => {
  it("creates an HTTP adapter from composition root", () => {
    const api = buildRepositoryApi();
    expect(api).toBeInstanceOf(HttpRepositoryApiAdapter);
  });
});
