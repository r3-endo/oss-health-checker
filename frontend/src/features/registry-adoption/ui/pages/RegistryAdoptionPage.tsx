import { useRegistryAdoptionRepositoriesQuery } from "../../hooks/use-registry-adoption-repositories-query";
import { RegistryAdoptionTable } from "../components/RegistryAdoptionTable";

export const RegistryAdoptionPage = () => {
  const query = useRegistryAdoptionRepositoriesQuery();

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Registry Adoption
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              npm package adoption signals for mapped repositories.
            </p>
          </div>
          <a href="/" className="text-sm text-text-secondary hover:underline">
            Back to Dashboard
          </a>
        </header>

        {query.isPending ? <p>Loading...</p> : null}
        {query.error ? (
          <p className="text-sm text-status-risky">
            Failed to load adoption data.
          </p>
        ) : null}

        {query.data ? <RegistryAdoptionTable rows={query.data} /> : null}
      </div>
    </main>
  );
};
