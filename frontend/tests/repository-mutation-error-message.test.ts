import { describe, expect, it } from "vitest";
import { resolveMutationErrorMessage } from "../src/features/repositories/hooks/error-message";

describe("resolveMutationErrorMessage", () => {
  it("returns undefined when mutation is not in error state", () => {
    const message = resolveMutationErrorMessage({
      isError: false,
      error: new Error("boom"),
      fallbackMessage: "fallback",
    });

    expect(message).toBeUndefined();
  });

  it("returns runtime error message when available", () => {
    const message = resolveMutationErrorMessage({
      isError: true,
      error: new Error("rate limited"),
      fallbackMessage: "fallback",
    });

    expect(message).toBe("rate limited");
  });

  it("returns fallback when thrown value is not an Error instance", () => {
    const message = resolveMutationErrorMessage({
      isError: true,
      error: { message: "hidden" },
      fallbackMessage: "fallback",
    });

    expect(message).toBe("fallback");
  });
});
