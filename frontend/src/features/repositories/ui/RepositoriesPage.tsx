import { Suspense } from "react";
import { useRegisterRepositoryMutation } from "../hooks/use-register-repository-mutation";
import { useRepositoriesQuery } from "../hooks/use-repositories-query";
import { RepositoryApiError } from "../api/repository-api-adapter";
import { QueryErrorBoundary } from "../../../app/error-boundary";
import { RepositoryList } from "./components/RepositoryList";
import { RepositoryListSkeleton } from "./components/RepositoryListSkeleton";
import { RepositoryRegisterForm } from "./components/RepositoryRegisterForm";

const RepositoryListContainer = () => {
  const { data } = useRepositoriesQuery();
  return <RepositoryList data={data} />;
};

export const RepositoriesPage = () => {
  const registerMutation = useRegisterRepositoryMutation();
  const registerErrorMessage =
    registerMutation.error instanceof RepositoryApiError
      ? registerMutation.error.message
      : registerMutation.isError
        ? "Failed to register repository."
        : undefined;

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
            errorMessage={registerErrorMessage}
          />
        </section>

        <QueryErrorBoundary>
          <Suspense fallback={<RepositoryListSkeleton />}>
            <RepositoryListContainer />
          </Suspense>
        </QueryErrorBoundary>
      </div>
    </main>
  );
};
