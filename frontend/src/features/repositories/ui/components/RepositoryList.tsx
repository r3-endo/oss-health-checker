import type { RepositoryView } from "../../model/types";
import { RepositoryRow } from "./RepositoryRow";

export const RepositoryList = ({
  data,
}: {
  data: readonly RepositoryView[];
}) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-surface p-4">
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
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.75 7.5h16.5"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">
          No repositories registered
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Add a GitHub repository URL above to start monitoring.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">
          Tracked Repositories
        </h2>
        <span className="text-xs text-text-tertiary">
          {data.length} {data.length === 1 ? "repository" : "repositories"}
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
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
                Warnings
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase md:table-cell">
                Last Commit
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase lg:table-cell">
                Last Release
              </th>
              <th className="hidden px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase md:table-cell">
                Issues
              </th>
              <th className="hidden px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase lg:table-cell">
                Contributors
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((repository) => (
              <RepositoryRow key={repository.id} repository={repository} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
