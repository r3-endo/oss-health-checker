import type { RepositoryView, RepositoryStatus } from "../../model/types";
import { useRefreshRepositoryMutation } from "../../hooks/use-refresh-repository-mutation";

export const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toISOString().slice(0, 10);
};

const statusStyles: Record<RepositoryStatus, string> = {
  Active: "bg-status-active/10 text-status-active border-status-active/20",
  Stale: "bg-status-stale/10 text-status-stale border-status-stale/20",
  Risky: "bg-status-risky/10 text-status-risky border-status-risky/20",
};

const warningLabels: Record<string, string> = {
  commit_stale: "Commit stale",
  release_stale: "Release stale",
  open_issues_high: "High issues",
};

type RepositoryRowViewProps = {
  repository: RepositoryView;
  isRefreshing: boolean;
  refreshErrorMessage?: string;
  onRefresh: () => void;
};

export const RepositoryRowView = ({
  repository,
  isRefreshing,
  refreshErrorMessage,
  onRefresh,
}: RepositoryRowViewProps) => (
  <tr className="transition-colors hover:bg-surface/60">
    <td className="px-5 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-primary">
          {repository.name}
        </span>
        <span className="text-xs text-text-tertiary">{repository.owner}</span>
      </div>
    </td>
    <td className="px-5 py-4">
      <span
        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${statusStyles[repository.status]}`}
      >
        {repository.status}
      </span>
    </td>
    <td className="px-5 py-4">
      {repository.warningReasons.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {repository.warningReasons.map((reason) => (
            <span
              key={reason}
              className="inline-flex rounded bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary"
            >
              {warningLabels[reason] ?? reason}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-xs text-text-tertiary">-</span>
      )}
    </td>
    <td className="hidden px-5 py-4 text-sm text-text-secondary md:table-cell">
      {formatTimestamp(repository.lastCommitAt)}
    </td>
    <td className="hidden px-5 py-4 text-sm text-text-secondary lg:table-cell">
      {formatTimestamp(repository.lastReleaseAt)}
    </td>
    <td className="hidden px-5 py-4 text-right text-sm tabular-nums text-text-secondary md:table-cell">
      {repository.openIssuesCount.toLocaleString()}
    </td>
    <td className="hidden px-5 py-4 text-right text-sm tabular-nums text-text-secondary lg:table-cell">
      {repository.contributorsCount.toLocaleString()}
    </td>
    <td className="px-5 py-4 text-right">
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center rounded border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRefreshing ? (
          <>
            <svg
              className="mr-1.5 h-3 w-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Refreshing
          </>
        ) : (
          "Refresh"
        )}
      </button>
      {refreshErrorMessage ? (
        <p role="alert" className="mt-1 text-xs text-status-risky">
          {refreshErrorMessage}
        </p>
      ) : null}
    </td>
  </tr>
);

export const RepositoryRow = ({
  repository,
}: {
  repository: RepositoryView;
}) => {
  const refreshMutation = useRefreshRepositoryMutation();

  return (
    <RepositoryRowView
      repository={repository}
      isRefreshing={refreshMutation.isPending}
      refreshErrorMessage={refreshMutation.errorMessage}
      onRefresh={() => refreshMutation.mutate(repository.id)}
    />
  );
};
