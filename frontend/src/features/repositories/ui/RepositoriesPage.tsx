import { useEffect, useMemo, useState } from "react";
import { resolveMutationErrorMessage } from "../hooks/error-message";
import { useCategoriesQuery } from "../hooks/use-categories-query";
import { useCategoryDetailQuery } from "../hooks/use-category-detail-query";
import { CategoryDetailPanel } from "./components/CategoryDetailPanel";
import { CategoryTabs } from "./components/CategoryTabs";
import { RepositoryListSkeleton } from "./components/RepositoryListSkeleton";

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="rounded border border-status-risky/20 bg-status-risky/5 px-5 py-4">
    <p className="text-sm text-status-risky">{message}</p>
  </div>
);

export const RepositoriesPage = () => {
  const categoriesQuery = useCategoriesQuery();
  const categories = useMemo(
    () =>
      [...(categoriesQuery.data ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    [categoriesQuery.data],
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    if (
      !selectedSlug ||
      !categories.some((category) => category.slug === selectedSlug)
    ) {
      setSelectedSlug(categories[0]!.slug);
    }
  }, [categories, selectedSlug]);

  const detailQuery = useCategoryDetailQuery(selectedSlug);

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            OSS Maintenance Health
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Compare repository maintenance signals by category.
          </p>
        </header>

        {categoriesQuery.isPending ? <RepositoryListSkeleton /> : null}

        {categoriesQuery.isError ? (
          <ErrorBanner
            message={
              resolveMutationErrorMessage({
                isError: categoriesQuery.isError,
                error: categoriesQuery.error,
                fallbackMessage: "Failed to load categories.",
              }) ?? "Failed to load categories."
            }
          />
        ) : null}

        {!categoriesQuery.isPending && !categoriesQuery.isError ? (
          <>
            <CategoryTabs
              categories={categories}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
            />

            <section aria-live="polite" className="space-y-3">
              <CategoryDetailPanel
                isPending={detailQuery.isPending}
                isError={detailQuery.isError}
                error={detailQuery.error}
                isFetching={detailQuery.isFetching}
                repositories={detailQuery.data?.repositories ?? null}
              />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};
