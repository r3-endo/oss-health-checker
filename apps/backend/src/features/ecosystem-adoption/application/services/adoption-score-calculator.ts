import type { RegistryAdoptionFetchResult } from "@oss-health-checker/common/features/ecosystem-adoption/application/ports/registry-provider-port.js";

export const calculateAdoptionScore = (
  signals: readonly RegistryAdoptionFetchResult[],
): number => {
  if (signals.length === 0) {
    return 0;
  }

  const knownDownloads = signals
    .map((signal) => signal.weeklyDownloads)
    .filter((value): value is number => value !== null);

  if (knownDownloads.length === 0) {
    return 0;
  }

  const total = knownDownloads.reduce((sum, value) => sum + value, 0);
  return Math.max(0, Math.min(100, Math.round(Math.log10(total + 1) * 20)));
};
