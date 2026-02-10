import type { RepositoryView } from "../../model/types";
import { RepositoryRow } from "./RepositoryRow";

export const RepositoryList = ({
  data,
  isLoading,
  isError,
}: {
  data: readonly RepositoryView[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) => {
  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Failed to load repositories.</p>;
  }

  if (!data || data.length === 0) {
    return <p>No repositories registered.</p>;
  }

  return (
    <section>
      {data.map((repository) => (
        <RepositoryRow key={repository.id} repository={repository} />
      ))}
    </section>
  );
};
