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
      <SkeletonBar className="h-5 w-14" />
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="h-5 w-24" />
    </td>
    <td className="hidden px-5 py-4 md:table-cell">
      <SkeletonBar className="h-4 w-20" />
    </td>
    <td className="hidden px-5 py-4 lg:table-cell">
      <SkeletonBar className="h-4 w-20" />
    </td>
    <td className="hidden px-5 py-4 md:table-cell">
      <SkeletonBar className="ml-auto h-4 w-10" />
    </td>
    <td className="hidden px-5 py-4 lg:table-cell">
      <SkeletonBar className="ml-auto h-4 w-10" />
    </td>
    <td className="px-5 py-4">
      <SkeletonBar className="ml-auto h-7 w-16" />
    </td>
  </tr>
);

export const RepositoryListSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <section>
    <div className="mb-4 flex items-center justify-between">
      <SkeletonBar className="h-4 w-36" />
      <SkeletonBar className="h-3 w-20" />
    </div>
    <div className="overflow-hidden rounded border border-border-subtle">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-surface">
            <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
              Repository
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
              Status
            </th>
            <th className="px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase">
              Warnings
            </th>
            <th className="hidden px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase md:table-cell">
              Last Commit
            </th>
            <th className="hidden px-5 py-3 text-left text-xs font-medium tracking-wider text-text-secondary uppercase lg:table-cell">
              Last Release
            </th>
            <th className="hidden px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase md:table-cell">
              Issues
            </th>
            <th className="hidden px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase lg:table-cell">
              Contributors
            </th>
            <th className="px-5 py-3 text-right text-xs font-medium tracking-wider text-text-secondary uppercase">
              Actions
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
