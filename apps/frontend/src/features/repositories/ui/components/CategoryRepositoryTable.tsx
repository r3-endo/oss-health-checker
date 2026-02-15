import type { CategoryRepositoryView } from "../../model/types";
import { EmptyState } from "./EmptyState";

const EmptyIcon = () => (
  <svg
    className="h-8 w-8 text-text-tertiary"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toISOString().slice(0, 16).replace("T", " ");
};

const formatNullableNumber = (value: number | null): string => {
  if (value === null) {
    return "N/A";
  }

  return value.toLocaleString();
};

const formatRelativeDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "N/A";
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
};

const toMaintainerType = (type: "Organization" | "User"): string =>
  type === "Organization" ? "Org" : "Individual";

const dataStatusStyles: Record<string, string> = {
  ok: "bg-status-active/10 text-status-active border-status-active/20",
  pending: "bg-status-stale/10 text-status-stale border-status-stale/20",
  rate_limited: "bg-status-risky/10 text-status-risky border-status-risky/20",
  error: "bg-status-risky/10 text-status-risky border-status-risky/20",
};

const toDataStatusLabel = (value: string): string =>
  value === "rate_limited"
    ? "Rate limited"
    : value.charAt(0).toUpperCase() + value.slice(1);

export const sortByRepositoryName = (
  repositories: readonly CategoryRepositoryView[],
): readonly CategoryRepositoryView[] =>
  [...repositories].sort((a, b) => {
    const left = `${a.owner.login}/${a.name}`.toLowerCase();
    const right = `${b.owner.login}/${b.name}`.toLowerCase();
    return left.localeCompare(right);
  });

export const CategoryRepositoryTable = ({
  repositories,
}: {
  repositories: readonly CategoryRepositoryView[];
}) => {
  const sorted = sortByRepositoryName(repositories);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<EmptyIcon />}
        title="No repositories in this category"
        description="Select another category or seed default repositories."
      />
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">
          Repositories
        </h2>
        <span className="text-xs text-text-tertiary">
          {sorted.length} {sorted.length === 1 ? "repository" : "repositories"}
        </span>
      </div>
      <div className="overflow-hidden rounded border border-border-subtle">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-surface">
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Repository
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Maintainer
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
                Open Issues
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Last Commit (default branch)
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Registry
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sorted.map((repository) => {
              const statusStyle =
                dataStatusStyles[repository.github.dataStatus];

              return (
                <tr key={`${repository.owner.login}/${repository.name}`}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <a
                        href={repository.links.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-text-primary underline-offset-2 hover:underline"
                      >
                        {repository.owner.login}/{repository.name}
                      </a>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">
                        {repository.owner.login}
                      </span>
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {toMaintainerType(repository.owner.type)}
                      </span>
                    </div>
                    {repository.github.dataStatus !== "ok" ? (
                      <p className="mt-1 text-xs text-status-risky">
                        {repository.github.errorMessage ??
                          toDataStatusLabel(repository.github.dataStatus)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-text-secondary">
                    {formatNullableNumber(repository.github.openIssues)}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {formatTimestamp(
                      repository.github.lastCommitToDefaultBranchAt,
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {repository.registry ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={repository.registry.npmUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-text-primary underline-offset-2 hover:underline"
                          >
                            npm ↗
                          </a>
                          {repository.registry.latestVersion ? (
                            <span className="text-xs text-text-tertiary">
                              latest: {repository.registry.latestVersion}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                          {repository.registry.lastPublishedAt ? (
                            <span>
                              published:{" "}
                              {formatRelativeDate(
                                repository.registry.lastPublishedAt,
                              )}
                            </span>
                          ) : null}
                          {repository.registry.weeklyDownloads !== null ? (
                            <span>
                              /{" "}
                              {formatCompactNumber(
                                repository.registry.weeklyDownloads,
                              )}{" "}
                              wk
                            </span>
                          ) : null}
                        </div>
                        {repository.registry.deprecated ? (
                          <span className="text-xs font-medium text-status-risky">
                            deprecated
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-text-tertiary">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
