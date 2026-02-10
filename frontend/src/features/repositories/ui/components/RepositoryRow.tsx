import type { RepositoryView } from "../../model/types";

export const RepositoryRow = ({
  repository,
}: {
  repository: RepositoryView;
}) => (
  <article>
    <h2>
      {repository.owner}/{repository.name}
    </h2>
    <p>Status: {repository.status}</p>
    <p>Warnings: {repository.warningReasons.join(", ") || "none"}</p>
  </article>
);
