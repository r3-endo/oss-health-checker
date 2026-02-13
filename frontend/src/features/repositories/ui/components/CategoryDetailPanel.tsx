import type { CategoryRepositoryView } from "../../model/types";
import { CategoryRepositoryTable } from "./CategoryRepositoryTable";
import { QueryErrorBanner } from "./QueryErrorBanner";
import { RepositoryListSkeleton } from "./RepositoryListSkeleton";

export const CategoryDetailPanel = ({
  isPending,
  errorMessage,
  isFetching,
  updatedAt,
  repositories,
}: {
  isPending: boolean;
  errorMessage?: string;
  isFetching: boolean;
  updatedAt: string | null;
  repositories: readonly CategoryRepositoryView[] | null;
}) => {
  if (isPending) {
    return <RepositoryListSkeleton rows={4} />;
  }

  if (errorMessage) {
    return <QueryErrorBanner message={errorMessage} />;
  }

  if (!repositories) {
    return null;
  }

  const updatedAgo =
    updatedAt !== null
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60_000),
        )
      : null;

  return (
    <>
      <div className="flex items-center justify-between">
        {isFetching ? (
          <p className="text-xs text-text-tertiary">
            Updating category data...
          </p>
        ) : (
          <span />
        )}
        <p className="text-xs text-text-tertiary">
          {updatedAgo === null
            ? "Updated time unknown"
            : `Updated ${updatedAgo} min ago`}
        </p>
      </div>
      <CategoryRepositoryTable repositories={repositories} />
    </>
  );
};
