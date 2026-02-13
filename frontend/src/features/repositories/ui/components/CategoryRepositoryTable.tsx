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

  return date.toISOString().slice(0, 10);
};

const formatNullableNumber = (value: number | null): string => {
  if (value === null) {
    return "N/A";
  }

  return value.toLocaleString();
};

const statusStyles: Record<string, string> = {
  Active: "bg-status-active/10 text-status-active border-status-active/20",
  Stale: "bg-status-stale/10 text-status-stale border-status-stale/20",
  Risky: "bg-status-risky/10 text-status-risky border-status-risky/20",
};

export const sortByHealthScoreDesc = (
  repositories: readonly CategoryRepositoryView[],
): readonly CategoryRepositoryView[] =>
  [...repositories].sort(
    (a, b) =>
      b.metrics.devHealth.healthScore - a.metrics.devHealth.healthScore,
  );

export const CategoryRepositoryTable = ({
  repositories,
}: {
  repositories: readonly CategoryRepositoryView[];
}) => {
  const sorted = sortByHealthScoreDesc(repositories);

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
        <h2 className="text-sm font-medium text-text-secondary">Repositories</h2>
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
              <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
                Health Score
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Last Commit
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
                Issue Delta 30d
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
                Commits 30d
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sorted.map((repository) => {
              const devHealth = repository.metrics.devHealth;

              return (
                <tr key={`${repository.owner}/${repository.name}`}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {repository.name}
                      </span>
                      <span className="text-xs text-text-tertiary">{repository.owner}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-text-primary">
                    {Math.round(devHealth.healthScore)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${statusStyles[devHealth.status]}`}
                    >
                      {devHealth.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {formatTimestamp(repository.lastCommit)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-text-secondary">
                    {formatNullableNumber(devHealth.issueGrowth30d)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-text-secondary">
                    {formatNullableNumber(devHealth.commitLast30d)}
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
