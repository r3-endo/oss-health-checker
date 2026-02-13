import { useRepositoriesPageData } from "../../hooks/use-repositories-page-data";
import { CategoryDetailPanel } from "../components/CategoryDetailPanel";
import { CategoryTabs } from "../components/CategoryTabs";
import { QueryErrorBanner } from "../components/QueryErrorBanner";
import { RepositoryListSkeleton } from "../components/RepositoryListSkeleton";

export const RepositoriesPage = () => {
  const {
    categories,
    selectedSlug,
    setSelectedSlug,
    categoriesQuery,
    detailQuery,
  } = useRepositoriesPageData();

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

        {categoriesQuery.errorMessage ? (
          <QueryErrorBanner message={categoriesQuery.errorMessage} />
        ) : null}

        {!categoriesQuery.isPending && !categoriesQuery.errorMessage ? (
          <>
            <CategoryTabs
              categories={categories}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
            />

            <section aria-live="polite" className="space-y-3">
              <CategoryDetailPanel
                isPending={detailQuery.isPending}
                errorMessage={detailQuery.errorMessage}
                isFetching={detailQuery.isFetching}
                updatedAt={detailQuery.data?.updatedAt ?? null}
                repositories={detailQuery.data?.repositories ?? null}
              />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};
