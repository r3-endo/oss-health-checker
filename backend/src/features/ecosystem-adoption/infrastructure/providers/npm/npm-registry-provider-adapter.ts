import type { AppEnv } from "../../../../../shared/config/env.js";
import {
  RegistryProviderError,
  type RegistryProviderPort,
} from "../../../application/ports/registry-provider-port.js";

const toJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const toInt = (value: unknown): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.trunc(value);
};

const toIsoDate = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export class NpmRegistryProviderAdapter implements RegistryProviderPort {
  readonly source = "npm" as const;

  constructor(private readonly env: AppEnv) {}

  async fetchPackageAdoption(packageName: string): Promise<{
    packageName: string;
    weeklyDownloads: number | null;
    downloadsDelta7d: number | null;
    downloadsDelta30d: number | null;
    lastPublishedAt: string | null;
    latestVersion: string | null;
  }> {
    const encoded = encodeURIComponent(packageName);
    const timeout = this.env.NPM_REGISTRY_TIMEOUT_MS;

    const downloadsResponse = await fetch(
      `${this.env.NPM_DOWNLOADS_API_BASE_URL}/point/last-week/${encoded}`,
      { signal: AbortSignal.timeout(timeout) },
    );

    if (!downloadsResponse.ok) {
      const payload = await toJson(downloadsResponse);
      if (downloadsResponse.status === 429) {
        throw new RegistryProviderError("RATE_LIMIT", "npm rate limited", {
          status: 429,
        });
      }
      throw new RegistryProviderError(
        "API_ERROR",
        typeof payload === "object" && payload !== null && "error" in payload
          ? String(
              (payload as { error?: unknown }).error ?? "npm downloads failed",
            )
          : "npm downloads failed",
        { status: downloadsResponse.status },
      );
    }

    const downloadsPayload = (await toJson(downloadsResponse)) as {
      downloads?: unknown;
    } | null;

    const packageResponse = await fetch(
      `${this.env.NPM_REGISTRY_API_BASE_URL}/${encoded}`,
      { signal: AbortSignal.timeout(timeout) },
    );

    if (!packageResponse.ok) {
      const payload = await toJson(packageResponse);
      if (packageResponse.status === 429) {
        throw new RegistryProviderError("RATE_LIMIT", "npm rate limited", {
          status: 429,
        });
      }
      throw new RegistryProviderError(
        "API_ERROR",
        typeof payload === "object" && payload !== null && "error" in payload
          ? String(
              (payload as { error?: unknown }).error ?? "npm metadata failed",
            )
          : "npm metadata failed",
        { status: packageResponse.status },
      );
    }

    const packagePayload = (await toJson(packageResponse)) as {
      "dist-tags"?: { latest?: unknown };
      time?: { [k: string]: unknown; modified?: unknown };
    } | null;

    const latestVersion =
      typeof packagePayload?.["dist-tags"]?.latest === "string"
        ? packagePayload["dist-tags"].latest
        : null;

    const lastPublishedAt = toIsoDate(
      (latestVersion ? packagePayload?.time?.[latestVersion] : undefined) ??
        packagePayload?.time?.modified,
    );

    return Object.freeze({
      packageName,
      weeklyDownloads: toInt(downloadsPayload?.downloads),
      downloadsDelta7d: null,
      downloadsDelta30d: null,
      lastPublishedAt,
      latestVersion,
    });
  }
}
