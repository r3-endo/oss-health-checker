import { useRegistryAdoptionRepositoriesQuery } from "../../hooks/use-registry-adoption-repositories-query";
import { useRequestAdoptionRefresh } from "../../hooks/use-request-adoption-refresh";
import { RegistryAdoptionTable } from "../components/RegistryAdoptionTable";

const toDateLabel = (value: string | null): string => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toISOString().slice(0, 10);
};

export const RegistryAdoptionPage = () => {
  const query = useRegistryAdoptionRepositoriesQuery();
  const refreshMutation = useRequestAdoptionRefresh();
  const latestAdoptionFetchedAt =
    query.data
      ?.map((row) => row.adoption.fetchedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

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
            <p className="mt-1 text-sm text-text-secondary">
              Updated every morning. Latest adoption snapshot:{" "}
              {toDateLabel(latestAdoptionFetchedAt)}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                className="rounded border border-border-subtle px-3 py-1.5 text-sm text-text-primary hover:border-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() =>
                  refreshMutation.mutate(
                    (query.data ?? []).map((row) => row.repository.id),
                  )
                }
                disabled={refreshMutation.isPending || !query.data}
              >
                {refreshMutation.isPending
                  ? "Requesting update..."
                  : "Request Adoption Data Update"}
              </button>
              {refreshMutation.isSuccess ? (
                <p className="text-xs text-text-secondary">
                  Requested refresh for {refreshMutation.data} repositories.
                </p>
              ) : null}
              {refreshMutation.isError ? (
                <p className="text-xs text-status-risky">
                  Failed to request adoption refresh.
                </p>
              ) : null}
            </div>
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
