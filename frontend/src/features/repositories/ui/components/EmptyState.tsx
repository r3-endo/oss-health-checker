import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {icon ? (
      <div className="mb-4 rounded-full bg-surface p-4">{icon}</div>
    ) : null}
    <p className="text-sm font-medium text-text-secondary">{title}</p>
    {description ? (
      <p className="mt-1 text-xs text-text-tertiary">{description}</p>
    ) : null}
  </div>
);
