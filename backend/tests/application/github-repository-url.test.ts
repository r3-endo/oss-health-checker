import { describe, expect, it } from "vitest";
import { parseGitHubRepositoryUrl } from "@backend/features/development-health/application/services/github-repository-url.js";

describe("parseGitHubRepositoryUrl", () => {
  it("parses standard GitHub URL", () => {
    const parsed = parseGitHubRepositoryUrl(
      "https://github.com/octocat/Hello-World",
    );

    expect(parsed).toEqual({
      owner: "octocat",
      name: "Hello-World",
      normalizedUrl: "https://github.com/octocat/Hello-World",
    });
  });

  it("accepts trailing slash and .git suffix", () => {
    const parsed = parseGitHubRepositoryUrl(
      "https://github.com/octocat/Hello-World.git/",
    );

    expect(parsed.owner).toBe("octocat");
    expect(parsed.name).toBe("Hello-World");
    expect(parsed.normalizedUrl).toBe("https://github.com/octocat/Hello-World");
  });

  it("rejects URLs with non-GitHub host", () => {
    expect(() =>
      parseGitHubRepositoryUrl(
        "https://github.com.evil.example/octocat/Hello-World",
      ),
    ).toThrowError(/github/i);
  });

  it("rejects URLs with query or fragment", () => {
    expect(() =>
      parseGitHubRepositoryUrl(
        "https://github.com/octocat/Hello-World?tab=readme",
      ),
    ).toThrowError(/url/i);

    expect(() =>
      parseGitHubRepositoryUrl("https://github.com/octocat/Hello-World#readme"),
    ).toThrowError(/url/i);
  });

  it("rejects URLs with credentials and port", () => {
    expect(() =>
      parseGitHubRepositoryUrl(
        "https://user:pass@github.com/octocat/Hello-World",
      ),
    ).toThrowError(/url/i);

    expect(() =>
      parseGitHubRepositoryUrl("https://github.com:444/octocat/Hello-World"),
    ).toThrowError(/url/i);
  });

  it("rejects extra path segments", () => {
    expect(() =>
      parseGitHubRepositoryUrl("https://github.com/octocat/Hello-World/issues"),
    ).toThrowError(/url/i);
  });
});
