export type ParsedGitHubRepository = Readonly<{
  owner: string;
  name: string;
  normalizedUrl: string;
}>;

export class GitHubRepositoryUrlError extends Error {
  constructor(message = "Invalid GitHub repository URL") {
    super(message);
    this.name = "GitHubRepositoryUrlError";
  }
}

const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    throw new GitHubRepositoryUrlError();
  }
};

export const parseGitHubRepositoryUrl = (
  inputUrl: string,
): ParsedGitHubRepository => {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new GitHubRepositoryUrlError();
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "https:" && protocol !== "http:") {
    throw new GitHubRepositoryUrlError();
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new GitHubRepositoryUrlError();
  }

  if (parsed.username || parsed.password || parsed.port) {
    throw new GitHubRepositoryUrlError();
  }

  if (parsed.search || parsed.hash) {
    throw new GitHubRepositoryUrlError();
  }

  const segments = parsed.pathname
    .split("/")
    .filter((segment) => segment.length > 0);
  if (segments.length !== 2) {
    throw new GitHubRepositoryUrlError();
  }

  const owner = decodeSegment(segments[0] ?? "");
  let name = decodeSegment(segments[1] ?? "");

  if (name.toLowerCase().endsWith(".git")) {
    name = name.slice(0, -4);
  }

  if (!OWNER_PATTERN.test(owner) || owner.endsWith("-")) {
    throw new GitHubRepositoryUrlError();
  }

  if (!REPOSITORY_PATTERN.test(name) || name === "." || name === "..") {
    throw new GitHubRepositoryUrlError();
  }

  return Object.freeze({
    owner,
    name,
    normalizedUrl: `https://github.com/${owner}/${name}`,
  });
};
