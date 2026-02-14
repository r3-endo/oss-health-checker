import {
  RepositoryGatewayError,
  type RepositoryGatewayPort,
  type RepositorySignals,
} from "../../application/ports/repository-gateway-port.js";
import type {
  CategoryRepositoryFacts,
  CategoryRepositoryFactsPort,
  RepositoryOwner,
} from "../../application/ports/category-repository-facts-port.js";
import type { AppEnv } from "../../../../shared/config/env.js";

type FetchFn = typeof fetch;

type GatewayEnv = Pick<
  AppEnv,
  "GITHUB_API_BASE_URL" | "GITHUB_API_TIMEOUT_MS" | "GITHUB_TOKEN"
>;

type GatewayDependencies = Readonly<{
  fetch: FetchFn;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}>;

type GitHubErrorPayload = Readonly<{
  message?: unknown;
}>;

const DEFAULT_API_VERSION = "2022-11-28";
const MAX_RETRIES = 3;
const MIN_BACKOFF_MS = 100;
const MAX_BACKOFF_MS = 5000;
const FACTS_CACHE_TTL_MS = 30 * 60 * 1000;
const ALLOWED_API_HOSTS = new Set(["api.github.com"]);

const defaultSleep = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const calculateExponentialBackoffMs = (attempt: number): number =>
  clamp(MIN_BACKOFF_MS * 2 ** attempt, MIN_BACKOFF_MS, MAX_BACKOFF_MS);

const toEpochMilliseconds = (seconds: number): number => seconds * 1000;

const parsePositiveInt = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parseRetryAfterMs = (response: Response): number | null => {
  const retryAfterSeconds = parsePositiveInt(
    response.headers.get("retry-after"),
  );
  if (retryAfterSeconds !== null) {
    return retryAfterSeconds * 1000;
  }

  const remaining = parsePositiveInt(
    response.headers.get("x-ratelimit-remaining"),
  );
  const resetEpochSeconds = parsePositiveInt(
    response.headers.get("x-ratelimit-reset"),
  );

  if (remaining === 0 && resetEpochSeconds !== null) {
    const now = Date.now();
    const resetAt = toEpochMilliseconds(resetEpochSeconds);
    return Math.max(resetAt - now, 0);
  }

  return null;
};

const parseLastPageFromLinkHeader = (
  linkHeader: string | null,
): number | null => {
  if (!linkHeader) {
    return null;
  }

  const entries = linkHeader.split(",").map((entry) => entry.trim());
  const lastEntry = entries.find((entry) => /rel="last"/.test(entry));
  if (!lastEntry) {
    return null;
  }

  const match = /<([^>]+)>/.exec(lastEntry);
  if (!match) {
    return null;
  }
  const lastUrl = match[1];
  if (!lastUrl) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(lastUrl);
  } catch {
    return null;
  }

  const page = parsePositiveInt(parsedUrl.searchParams.get("page"));
  return page !== null && page > 0 ? page : null;
};

const normalizeCount = (value: unknown, fieldName: string): number => {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new RepositoryGatewayError(
      "API_ERROR",
      `Invalid ${fieldName} in GitHub API response`,
      { status: 502 },
    );
  }
  return value as number;
};

const parseIsoDate = (value: unknown, fieldName: string): Date => {
  if (typeof value !== "string") {
    throw new RepositoryGatewayError(
      "API_ERROR",
      `Invalid ${fieldName} in GitHub API response`,
      { status: 502 },
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RepositoryGatewayError(
      "API_ERROR",
      `Invalid ${fieldName} in GitHub API response`,
      { status: 502 },
    );
  }

  return date;
};

const parseMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const message = (payload as GitHubErrorPayload).message;
  return typeof message === "string" && message.length > 0
    ? message
    : undefined;
};

const parseNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new RepositoryGatewayError(
      "API_ERROR",
      `Invalid ${fieldName} in GitHub API response`,
      { status: 502 },
    );
  }

  return value;
};

const parseRepositoryOwner = (payload: unknown): RepositoryOwner => {
  if (!payload || typeof payload !== "object") {
    throw new RepositoryGatewayError(
      "API_ERROR",
      "Invalid owner in GitHub API response",
      { status: 502 },
    );
  }

  const rawLogin = (payload as { login?: unknown }).login;
  const rawType = (payload as { type?: unknown }).type;
  const login = parseNonEmptyString(rawLogin, "owner.login");

  if (rawType !== "Organization" && rawType !== "User") {
    throw new RepositoryGatewayError(
      "API_ERROR",
      "Invalid owner.type in GitHub API response",
      { status: 502 },
    );
  }

  return Object.freeze({
    login,
    type: rawType,
  });
};

const buildRepositoryApiPath = (owner: string, name: string): string =>
  `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

const validateApiBaseUrl = (rawBaseUrl: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(rawBaseUrl);
  } catch {
    throw new RepositoryGatewayError(
      "API_ERROR",
      "Invalid GITHUB_API_BASE_URL",
      { status: 500 },
    );
  }

  if (parsed.protocol !== "https:") {
    throw new RepositoryGatewayError(
      "API_ERROR",
      "GITHUB_API_BASE_URL must use https",
      { status: 500 },
    );
  }

  if (parsed.username || parsed.password || parsed.port) {
    throw new RepositoryGatewayError(
      "API_ERROR",
      "GITHUB_API_BASE_URL must not include credentials or port",
      { status: 500 },
    );
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_API_HOSTS.has(host)) {
    throw new RepositoryGatewayError(
      "API_ERROR",
      `GITHUB_API_BASE_URL host is not allowed: ${parsed.hostname}`,
      { status: 500 },
    );
  }

  return rawBaseUrl.replace(/\/+$/, "");
};

export class GitHubRestRepositoryGateway
  implements RepositoryGatewayPort, CategoryRepositoryFactsPort
{
  private readonly baseUrl: string;
  private readonly env: GatewayEnv;
  private readonly deps: GatewayDependencies;
  private readonly factsCache = new Map<
    string,
    Readonly<{ value: CategoryRepositoryFacts; expiresAtMs: number }>
  >();
  private readonly inFlightFacts = new Map<
    string,
    Promise<CategoryRepositoryFacts>
  >();

  constructor(env: GatewayEnv, dependencies?: Partial<GatewayDependencies>) {
    this.baseUrl = validateApiBaseUrl(env.GITHUB_API_BASE_URL);
    this.env = env;
    this.deps = {
      fetch: dependencies?.fetch ?? fetch,
      sleep: dependencies?.sleep ?? defaultSleep,
      now: dependencies?.now ?? Date.now,
    };
  }

  async fetchSignals(owner: string, name: string): Promise<RepositorySignals> {
    const repoPath = buildRepositoryApiPath(owner, name);
    const commitsPromise = this.requestJson<
      Array<{
        commit?: { committer?: { date?: string }; author?: { date?: string } };
      }>
    >(`${repoPath}/commits?per_page=1`);

    const repositoryPromise = this.requestJson<{ open_issues_count?: unknown }>(
      repoPath,
    );

    const releasePromise = this.requestJson<{ published_at?: unknown }>(
      `${repoPath}/releases/latest`,
      { allowNotFound: true },
    );

    const contributorsPromise = this.requestJson<readonly unknown[]>(
      `${repoPath}/contributors?per_page=1&anon=1`,
    );

    const [commits, repository, release, contributors] = await Promise.all([
      commitsPromise,
      repositoryPromise,
      releasePromise,
      contributorsPromise,
    ]);

    if (!Array.isArray(commits.body) || commits.body.length === 0) {
      throw new RepositoryGatewayError(
        "API_ERROR",
        "GitHub API returned no commits",
        {
          status: 502,
        },
      );
    }

    const latestCommit = commits.body[0];
    const latestCommitDate =
      latestCommit?.commit?.committer?.date ??
      latestCommit?.commit?.author?.date;

    const lastCommitAt = parseIsoDate(latestCommitDate, "commit date");

    let lastReleaseAt: Date | null = null;
    if (release.status !== 404) {
      lastReleaseAt = parseIsoDate(
        release.body?.published_at,
        "release published_at",
      );
    }

    const openIssuesCount = normalizeCount(
      repository.body?.open_issues_count,
      "open_issues_count",
    );

    const contributorsByLink = parseLastPageFromLinkHeader(
      contributors.response.headers.get("link"),
    );

    let contributorsCount = contributorsByLink;
    if (contributorsCount === null) {
      if (!Array.isArray(contributors.body)) {
        throw new RepositoryGatewayError(
          "API_ERROR",
          "Invalid contributors response from GitHub API",
          { status: 502 },
        );
      }
      contributorsCount = contributors.body.length === 0 ? 0 : 1;
    }

    return Object.freeze({
      lastCommitAt,
      lastReleaseAt,
      openIssuesCount,
      contributorsCount,
    });
  }

  async fetchCategoryRepositoryFacts(
    owner: string,
    name: string,
  ): Promise<CategoryRepositoryFacts> {
    const key = `${owner}/${name}`;
    const cached = this.factsCache.get(key);
    const now = this.deps.now();

    if (cached && cached.expiresAtMs > now) {
      return cached.value;
    }

    const inFlight = this.inFlightFacts.get(key);
    if (inFlight) {
      return inFlight;
    }

    const promise = this.fetchCategoryRepositoryFactsFresh(owner, name)
      .then((fresh) => {
        this.factsCache.set(key, {
          value: fresh,
          expiresAtMs: this.deps.now() + FACTS_CACHE_TTL_MS,
        });
        return fresh;
      })
      .catch((error: unknown) => {
        if (cached) {
          return cached.value;
        }

        if (error instanceof RepositoryGatewayError) {
          const status = error.code === "RATE_LIMIT" ? "rate_limited" : "error";
          return Object.freeze({
            owner: Object.freeze({
              login: owner,
              type: "User" as const,
            }),
            openIssues: null,
            defaultBranch: null,
            lastCommitToDefaultBranchAt: null,
            dataStatus: status,
            errorMessage: error.message,
          });
        }

        return Object.freeze({
          owner: Object.freeze({
            login: owner,
            type: "User" as const,
          }),
          openIssues: null,
          defaultBranch: null,
          lastCommitToDefaultBranchAt: null,
          dataStatus: "error" as const,
          errorMessage: "Failed to fetch repository facts",
        });
      })
      .finally(() => {
        this.inFlightFacts.delete(key);
      });

    this.inFlightFacts.set(key, promise);
    return promise;
  }

  private async fetchCategoryRepositoryFactsFresh(
    owner: string,
    name: string,
  ): Promise<CategoryRepositoryFacts> {
    const repoPath = buildRepositoryApiPath(owner, name);

    const repository = await this.requestJson<{
      owner?: unknown;
      default_branch?: unknown;
    }>(repoPath);
    const ownerInfo = parseRepositoryOwner(repository.body.owner);
    const defaultBranch = parseNonEmptyString(
      repository.body.default_branch,
      "default_branch",
    );

    const latestCommit = await this.requestJson<{
      commit?: { committer?: { date?: unknown }; author?: { date?: unknown } };
    }>(`${repoPath}/commits/${encodeURIComponent(defaultBranch)}`);
    const latestCommitDate =
      latestCommit.body.commit?.committer?.date ??
      latestCommit.body.commit?.author?.date;
    const lastCommitToDefaultBranchAt = parseIsoDate(
      latestCommitDate,
      "commit date",
    ).toISOString();

    const issueQuery = encodeURIComponent(
      `repo:${owner}/${name} type:issue state:open`,
    );
    const openIssues = await this.requestJson<{ total_count?: unknown }>(
      `/search/issues?q=${issueQuery}`,
    );

    return Object.freeze({
      owner: ownerInfo,
      openIssues: normalizeCount(openIssues.body.total_count, "total_count"),
      defaultBranch,
      lastCommitToDefaultBranchAt,
      dataStatus: "ok",
      errorMessage: null,
    });
  }

  private async requestJson<T>(
    path: string,
    options?: Readonly<{ allowNotFound?: boolean }>,
  ): Promise<Readonly<{ status: number; response: Response; body: T }>> {
    let lastError: RepositoryGatewayError | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const response = await this.performRequest(path);
        const payload = await this.readJson(response);

        if (response.ok) {
          return Object.freeze({
            status: response.status,
            response,
            body: payload as T,
          });
        }

        if (options?.allowNotFound && response.status === 404) {
          return Object.freeze({
            status: response.status,
            response,
            body: payload as T,
          });
        }

        const errorMessage =
          parseMessage(payload) ?? `GitHub API returned ${response.status}`;

        const isRateLimited =
          response.status === 429 ||
          (response.status === 403 &&
            (response.headers.get("x-ratelimit-remaining") === "0" ||
              /rate limit/i.test(errorMessage)));

        if (isRateLimited) {
          const waitMs = parseRetryAfterMs(response) ?? 60_000;
          if (attempt < MAX_RETRIES) {
            await this.deps.sleep(Math.max(waitMs, MIN_BACKOFF_MS));
            continue;
          }

          throw new RepositoryGatewayError("RATE_LIMIT", errorMessage, {
            status: response.status,
            retryAfterSeconds: Math.ceil(waitMs / 1000),
          });
        }

        if (response.status >= 500 && attempt < MAX_RETRIES) {
          const backoffMs = calculateExponentialBackoffMs(attempt);
          await this.deps.sleep(backoffMs);
          continue;
        }

        throw new RepositoryGatewayError("API_ERROR", errorMessage, {
          status: response.status,
        });
      } catch (error) {
        if (error instanceof RepositoryGatewayError) {
          lastError = error;
          break;
        }

        if (attempt < MAX_RETRIES) {
          const backoffMs = calculateExponentialBackoffMs(attempt);
          await this.deps.sleep(backoffMs);
          continue;
        }

        lastError = new RepositoryGatewayError(
          "API_ERROR",
          "Failed to call GitHub API",
          {
            status: 502,
            cause: error,
          },
        );
      }
    }

    throw (
      lastError ??
      new RepositoryGatewayError("API_ERROR", "Failed to call GitHub API", {
        status: 502,
      })
    );
  }

  private async performRequest(path: string): Promise<Response> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.env.GITHUB_API_TIMEOUT_MS,
    );

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": DEFAULT_API_VERSION,
    };

    if (this.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${this.env.GITHUB_TOKEN}`;
    }

    try {
      return await this.deps.fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }
}
