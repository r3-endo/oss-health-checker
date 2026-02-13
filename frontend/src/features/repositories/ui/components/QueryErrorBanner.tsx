export const QueryErrorBanner = ({ message }: { message: string }) => (
  <div className="rounded border border-status-risky/20 bg-status-risky/5 px-5 py-4">
    <p className="text-sm text-status-risky">{message}</p>
  </div>
);
