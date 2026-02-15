import type { RegistryAdoptionRow } from "../../model/schemas";

const fmt = (value: string | null): string => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toISOString().slice(0, 10);
};

const num = (value: number | null): string =>
  value === null ? "N/A" : value.toLocaleString();

const adoptionCell = (
  row: RegistryAdoptionRow,
  key:
    | "packageName"
    | "weeklyDownloads"
    | "downloadsDelta7d"
    | "downloadsDelta30d"
    | "lastPublishedAt"
    | "latestVersion",
): string => {
  if (row.adoption.mappingStatus === "not_mapped") return "Not Mapped";
  if (key === "packageName" || key === "latestVersion") {
    const v = row.adoption[key];
    return v ?? "N/A";
  }
  if (key === "lastPublishedAt") {
    return fmt(row.adoption.lastPublishedAt);
  }
  if (key === "weeklyDownloads") {
    return num(row.adoption.weeklyDownloads);
  }
  return num(row.adoption[key]);
};

export const RegistryAdoptionTable = ({
  rows,
}: {
  rows: readonly RegistryAdoptionRow[];
}) => {
  if (rows.length === 0) {
    return <p className="text-sm text-text-secondary">No repositories.</p>;
  }

  return (
    <div className="overflow-auto rounded border border-border-subtle">
      <table className="w-full">
        <thead>
          <tr className="bg-surface">
            <th className="px-3 py-2 text-left text-xs">Repository</th>
            <th className="px-3 py-2 text-left text-xs">Package Name</th>
            <th className="px-3 py-2 text-right text-xs">Weekly Downloads</th>
            <th className="px-3 py-2 text-right text-xs">Δ7d</th>
            <th className="px-3 py-2 text-right text-xs">Δ30d</th>
            <th className="px-3 py-2 text-left text-xs">Last Published Date</th>
            <th className="px-3 py-2 text-left text-xs">Latest Version</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.repository.id}
              className="border-t border-border-subtle"
            >
              <td className="px-3 py-2 text-sm">
                {row.repository.owner}/{row.repository.name}
              </td>
              <td className="px-3 py-2 text-sm">
                {adoptionCell(row, "packageName")}
              </td>
              <td className="px-3 py-2 text-right text-sm">
                {adoptionCell(row, "weeklyDownloads")}
              </td>
              <td className="px-3 py-2 text-right text-sm">
                {adoptionCell(row, "downloadsDelta7d")}
              </td>
              <td className="px-3 py-2 text-right text-sm">
                {adoptionCell(row, "downloadsDelta30d")}
              </td>
              <td className="px-3 py-2 text-sm">
                {adoptionCell(row, "lastPublishedAt")}
              </td>
              <td className="px-3 py-2 text-sm">
                {adoptionCell(row, "latestVersion")}
                {row.adoption.adoptionFetchStatus === "failed" ? (
                  <span className="ml-2 text-xs text-status-risky">
                    Update failed
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
