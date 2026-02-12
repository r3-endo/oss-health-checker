import type { RepositoryView } from "../../model/types";
import { RepositoryApiError } from "../../api/repository-api-adapter";
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
  <tr>
    <td>
      {repository.owner}/{repository.name}
    </td>
    <td>{repository.status}</td>
    <td>{repository.warningReasons.join(", ") || "none"}</td>
    <td>{formatTimestamp(repository.lastCommitAt)}</td>
    <td>{formatTimestamp(repository.lastReleaseAt)}</td>
    <td>{repository.openIssuesCount}</td>
    <td>{repository.contributorsCount}</td>
    <td>
      <button type="button" onClick={onRefresh} disabled={isRefreshing}>
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </button>
      {refreshErrorMessage ? <p role="alert">{refreshErrorMessage}</p> : null}
    </td>
  </tr>
);

export const RepositoryRow = ({
  repository,
}: {
  repository: RepositoryView;
}) => {
  const refreshMutation = useRefreshRepositoryMutation();
  const refreshErrorMessage =
    refreshMutation.error instanceof RepositoryApiError
      ? refreshMutation.error.message
      : refreshMutation.isError
        ? "Failed to refresh repository."
        : undefined;

  return (
    <RepositoryRowView
      repository={repository}
      isRefreshing={refreshMutation.isPending}
      refreshErrorMessage={refreshErrorMessage}
      onRefresh={() => refreshMutation.mutate(repository.id)}
    />
  );
};
