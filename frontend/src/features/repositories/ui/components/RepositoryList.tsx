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
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Reasons</th>
            <th>Last Commit</th>
            <th>Last Release</th>
            <th>Open Issues</th>
            <th>Contributors</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((repository) => (
            <RepositoryRow key={repository.id} repository={repository} />
          ))}
        </tbody>
      </table>
    </section>
  );
};
