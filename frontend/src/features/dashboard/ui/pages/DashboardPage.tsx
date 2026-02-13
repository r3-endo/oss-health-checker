import { useCategoriesQuery } from "../../../repositories/hooks/use-categories-query";
import { useRegistryAdoptionRepositoriesQuery } from "../../../registry-adoption/hooks/use-registry-adoption-repositories-query";

const toDateLabel = (value: string | null): string => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toISOString().slice(0, 10);
};

export const DashboardPage = () => {
  const categoriesQuery = useCategoriesQuery();
  const registryQuery = useRegistryAdoptionRepositoriesQuery();

  const githubCategoryCount = categoriesQuery.data?.length ?? 0;
  const registryRepoCount = registryQuery.data?.length ?? 0;
  const latestAdoptionFetchedAt =
    registryQuery.data
      ?.map((row) => row.adoption.fetchedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            OSS Dashboard
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Choose a view: GitHub health by category, or registry adoption.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Updated every morning. Latest adoption snapshot:{" "}
            {toDateLabel(latestAdoptionFetchedAt)}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <a
            href="/github"
            className="rounded border border-border-subtle bg-surface p-4 hover:border-text-secondary"
          >
            <h2 className="text-lg font-semibold text-text-primary">
              GitHub Health
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Categories: {githubCategoryCount}
            </p>
          </a>

          <a
            href="/registry"
            className="rounded border border-border-subtle bg-surface p-4 hover:border-text-secondary"
          >
            <h2 className="text-lg font-semibold text-text-primary">
              Registry Adoption
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Repositories: {registryRepoCount}
            </p>
          </a>
        </section>
      </div>
    </main>
  );
};
