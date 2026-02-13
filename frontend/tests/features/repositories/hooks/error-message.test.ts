import { describe, expect, it } from "vitest";
import { resolveApiErrorMessage } from "../../../../src/features/repositories/hooks/error-message";
import { RepositoryApiError } from "../../../../src/features/repositories/api/repository-api-adapter";

describe("resolveApiErrorMessage", () => {
  it("returns undefined when mutation is not in error state", () => {
    const message = resolveApiErrorMessage({
      isError: false,
      error: new RepositoryApiError(400, "VALIDATION_ERROR", "bad input"),
      fallbackMessage: "fallback",
    });

    expect(message).toBeUndefined();
  });

  it("returns domain error message for RepositoryApiError", () => {
    const message = resolveApiErrorMessage({
      isError: true,
      error: new RepositoryApiError(429, "RATE_LIMIT", "rate limited"),
      fallbackMessage: "fallback",
    });

    expect(message).toBe("rate limited");
  });

  it("returns fallback for non-domain Error to prevent internal text leakage", () => {
    const message = resolveApiErrorMessage({
      isError: true,
      error: new TypeError("Failed to fetch"),
      fallbackMessage: "fallback",
    });

    expect(message).toBe("fallback");
  });

  it("returns fallback when thrown value is not an Error instance", () => {
    const message = resolveApiErrorMessage({
      isError: true,
      error: { message: "hidden" },
      fallbackMessage: "fallback",
    });

    expect(message).toBe("fallback");
  });
});
