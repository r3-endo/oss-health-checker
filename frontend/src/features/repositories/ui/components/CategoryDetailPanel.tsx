import { resolveMutationErrorMessage } from "../../hooks/error-message";
import type { CategoryRepositoryView } from "../../model/types";
import { CategoryRepositoryTable } from "./CategoryRepositoryTable";
import { RepositoryListSkeleton } from "./RepositoryListSkeleton";

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="rounded border border-status-risky/20 bg-status-risky/5 px-5 py-4">
    <p className="text-sm text-status-risky">{message}</p>
  </div>
);

export const CategoryDetailPanel = ({
  isPending,
  isError,
  error,
  isFetching,
  repositories,
}: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  repositories: readonly CategoryRepositoryView[] | null;
}) => {
  if (isPending) {
    return <RepositoryListSkeleton rows={4} />;
  }

  if (isError) {
    return (
      <ErrorBanner
        message={
          resolveMutationErrorMessage({
            isError,
            error,
            fallbackMessage: "Failed to load category repositories.",
          }) ?? "Failed to load category repositories."
        }
      />
    );
  }

  if (!repositories) {
    return null;
  }

  return (
    <>
      {isFetching ? (
        <p className="text-xs text-text-tertiary">Updating category data...</p>
      ) : null}
      <CategoryRepositoryTable repositories={repositories} />
    </>
  );
};
