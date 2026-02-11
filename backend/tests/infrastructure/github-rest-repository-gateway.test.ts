import { describe, expect, it, vi } from "vitest";
import { RepositoryGatewayError } from "../../src/application/ports/repository-gateway-port.js";
import { GitHubRestRepositoryGateway } from "../../src/infrastructure/gateways/github-rest-repository-gateway.js";

const createJsonResponse = (
  payload: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): Response =>
  new Response(JSON.stringify(payload), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

describe("GitHubRestRepositoryGateway", () => {
  it("normalizes signals from GitHub REST responses", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse([
          { commit: { committer: { date: "2024-05-01T00:00:00Z" } } },
        ]),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          open_issues_count: 42,
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({}, { status: 404 }))
      .mockResolvedValueOnce(
        createJsonResponse([{ login: "octocat", contributions: 1 }], {
          headers: {
            link: '<https://api.github.com/repositories/1/contributors?page=7&per_page=1>; rel="last"',
          },
        }),
      );

    const gateway = new GitHubRestRepositoryGateway(
      {
        GITHUB_API_BASE_URL: "https://api.github.com",
        GITHUB_API_TIMEOUT_MS: 1000,
        GITHUB_TOKEN: undefined,
      },
      {
        fetch: fetchMock,
        sleep: async () => undefined,
      },
    );

    const result = await gateway.fetchSignals("octocat", "Hello-World");

    expect(result.lastCommitAt.toISOString()).toBe("2024-05-01T00:00:00.000Z");
    expect(result.lastReleaseAt).toBeNull();
    expect(result.openIssuesCount).toBe(42);
    expect(result.contributorsCount).toBe(7);
  });

  it("throws api error when commits response is empty", async () => {
    const gateway = new GitHubRestRepositoryGateway(
      {
        GITHUB_API_BASE_URL: "https://api.github.com",
        GITHUB_API_TIMEOUT_MS: 1000,
        GITHUB_TOKEN: undefined,
      },
      {
        fetch: vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(createJsonResponse([]))
          .mockResolvedValueOnce(createJsonResponse({ open_issues_count: 1 }))
          .mockResolvedValueOnce(createJsonResponse({}, { status: 404 }))
          .mockResolvedValueOnce(createJsonResponse([])),
        sleep: async () => undefined,
      },
    );

    await expect(
      gateway.fetchSignals("octocat", "Hello-World"),
    ).rejects.toMatchObject({
      name: "RepositoryGatewayError",
      code: "API_ERROR",
    });
  });

  it("retries once on secondary rate limit then throws rate-limit error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      createJsonResponse(
        { message: "You have exceeded a secondary rate limit." },
        {
          status: 429,
          headers: {
            "retry-after": "60",
          },
        },
      ),
    );

    const sleepMock = vi.fn(async () => undefined);

    const gateway = new GitHubRestRepositoryGateway(
      {
        GITHUB_API_BASE_URL: "https://api.github.com",
        GITHUB_API_TIMEOUT_MS: 1000,
        GITHUB_TOKEN: undefined,
      },
      {
        fetch: fetchMock,
        sleep: sleepMock,
      },
    );

    await expect(
      gateway.fetchSignals("octocat", "Hello-World"),
    ).rejects.toEqual(
      expect.objectContaining<Partial<RepositoryGatewayError>>({
        code: "RATE_LIMIT",
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(sleepMock).toHaveBeenCalledTimes(4);
  });

  it("rejects non-https or non-api.github.com base URL", () => {
    expect(
      () =>
        new GitHubRestRepositoryGateway({
          GITHUB_API_BASE_URL: "http://api.github.com",
          GITHUB_API_TIMEOUT_MS: 1000,
          GITHUB_TOKEN: undefined,
        }),
    ).toThrowError(/https/i);

    expect(
      () =>
        new GitHubRestRepositoryGateway({
          GITHUB_API_BASE_URL: "https://github.local/api/v3",
          GITHUB_API_TIMEOUT_MS: 1000,
          GITHUB_TOKEN: undefined,
        }),
    ).toThrowError(/not allowed/i);
  });
});
