import { describe, expect, it } from "vitest";
import { resolveRoute } from "../../../../src/app/router";

describe("resolveRoute", () => {
  it("resolves dashboard/github/registry paths", () => {
    expect(resolveRoute("/")).toBe("dashboard");
    expect(resolveRoute("/github")).toBe("github");
    expect(resolveRoute("/registry")).toBe("registry");
    expect(resolveRoute("/registry/")).toBe("registry");
  });

  it("returns not_found for unknown paths", () => {
    expect(resolveRoute("/unknown")).toBe("not_found");
  });
});
