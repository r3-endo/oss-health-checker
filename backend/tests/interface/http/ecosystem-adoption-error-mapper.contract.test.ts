import { describe, expect, it } from "vitest";
import { ApplicationError } from "@oss-health-checker/common/features/ecosystem-adoption/application/errors/application-error.js";
import { mapErrorToHttp } from "../../../../apps/backend/features/ecosystem-adoption/interface/http/error-mapper.js";

const createContext = () =>
  ({
    json: (body: unknown, status: number) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  }) as never;

describe("ecosystem adoption error mapper", () => {
  it("maps major ApplicationError codes to expected HTTP statuses", async () => {
    const cases: ReadonlyArray<readonly [ApplicationError, number]> = [
      [new ApplicationError("VALIDATION_ERROR", "bad"), 400],
      [new ApplicationError("NOT_FOUND", "missing"), 404],
      [new ApplicationError("RATE_LIMIT", "rate"), 429],
      [new ApplicationError("EXTERNAL_API_ERROR", "upstream"), 502],
      [new ApplicationError("INTERNAL_ERROR", "boom"), 500],
    ];

    for (const [error, expectedStatus] of cases) {
      const response = mapErrorToHttp(createContext(), error);
      expect(response.status).toBe(expectedStatus);
      const body = (await response.json()) as { error: { code: string } };
      expect(body.error.code).toBe(error.code);
    }
  });
});
