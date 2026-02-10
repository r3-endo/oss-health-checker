import { useRegisterRepositoryMutation } from "../hooks/use-register-repository-mutation";
import { useRepositoriesQuery } from "../hooks/use-repositories-query";
import { RepositoryList } from "./components/RepositoryList";
import { RepositoryRegisterForm } from "./components/RepositoryRegisterForm";

export const RepositoriesPage = () => {
  const query = useRepositoriesQuery();
  const registerMutation = useRegisterRepositoryMutation();

  return (
    <main>
      <h1>OSS Maintenance Health</h1>
      <RepositoryRegisterForm
        isSubmitting={registerMutation.isPending}
        onSubmit={(input) => registerMutation.mutate(input)}
      />
      {registerMutation.isError && <p>Failed to register repository.</p>}
      <RepositoryList
        data={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
      />
    </main>
  );
};
