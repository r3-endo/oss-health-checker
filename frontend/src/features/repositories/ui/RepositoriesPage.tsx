import { Suspense } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useRegisterRepositoryMutation } from "../hooks/use-register-repository-mutation";
import { useRepositoriesQuery } from "../hooks/use-repositories-query";
import { QueryErrorBoundary } from "../../../app/error-boundary";
import { RepositoryList } from "./components/RepositoryList";
import { RepositoryListSkeleton } from "./components/RepositoryListSkeleton";
import { RepositoryRegisterForm } from "./components/RepositoryRegisterForm";

/**
 * Suspense-aware container — calls `useSuspenseQuery` so it **must** be
 * rendered inside a `<Suspense>` + `<ErrorBoundary>` pair.
 * Kept private to this page module to prevent accidental boundary leaks.
 */
const SuspendedRepositoryList = () => {
  const { data } = useRepositoriesQuery();
  return <RepositoryList data={data} />;
};

/**
 * Page component — owns the async boundaries (Suspense / ErrorBoundary)
 * and the register-mutation side-effect. All presentation is delegated
 * to child components that receive only resolved data or callbacks.
 */
export const RepositoriesPage = () => {
  const registerMutation = useRegisterRepositoryMutation();

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            OSS Maintenance Health
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Monitor the maintenance status of your open source dependencies.
          </p>
        </header>

        <section className="mb-10">
          <RepositoryRegisterForm
            isSubmitting={registerMutation.isPending}
            onSubmit={(input) => registerMutation.mutate(input)}
            errorMessage={registerMutation.errorMessage}
          />
        </section>

        <QueryErrorResetBoundary>
          {({ reset }) => (
            <QueryErrorBoundary onReset={reset}>
              <Suspense fallback={<RepositoryListSkeleton />}>
                <SuspendedRepositoryList />
              </Suspense>
            </QueryErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </div>
    </main>
  );
};
