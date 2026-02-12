import { useRegisterRepositoryMutation } from "../hooks/use-register-repository-mutation";
import { useRepositoriesQuery } from "../hooks/use-repositories-query";
import { RepositoryApiError } from "../api/repository-api-adapter";
import { RepositoryList } from "./components/RepositoryList";
import { RepositoryRegisterForm } from "./components/RepositoryRegisterForm";

export const RepositoriesPage = () => {
  const query = useRepositoriesQuery();
  const registerMutation = useRegisterRepositoryMutation();
  const registerErrorMessage =
    registerMutation.error instanceof RepositoryApiError
      ? registerMutation.error.message
      : registerMutation.isError
        ? "Failed to register repository."
        : undefined;

  return (
    <main>
      <h1>OSS Maintenance Health</h1>
      <RepositoryRegisterForm
        isSubmitting={registerMutation.isPending}
        onSubmit={(input) => registerMutation.mutate(input)}
        errorMessage={registerErrorMessage}
      />
      <RepositoryList
        data={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
      />
    </main>
  );
};
