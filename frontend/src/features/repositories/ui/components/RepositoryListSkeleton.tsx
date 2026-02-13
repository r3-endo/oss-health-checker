const SkeletonBar = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-surface-elevated ${className}`} />
);

const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <SkeletonBar className="h-4 w-28" />
        <SkeletonBar className="h-3 w-16" />
      </div>
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="ml-auto h-4 w-10" />
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="h-5 w-14" />
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="h-4 w-20" />
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="ml-auto h-4 w-14" />
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="ml-auto h-4 w-14" />
    </td>
  </tr>
);

export const RepositoryListSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <section>
    <div className="mb-4 flex items-center justify-between">
      <SkeletonBar className="h-4 w-28" />
      <SkeletonBar className="h-3 w-20" />
    </div>
    <div className="overflow-hidden rounded border border-border-subtle">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-surface">
            <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
              Repository
            </th>
            <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
              Health Score
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
              Status
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
              Last Commit
            </th>
            <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
              Issue Delta 30d
            </th>
            <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
              Commits 30d
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {Array.from({ length: rows }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
