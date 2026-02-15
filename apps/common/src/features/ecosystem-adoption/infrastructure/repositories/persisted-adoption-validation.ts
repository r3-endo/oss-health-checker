import type {
  AdoptionSnapshot,
  RegistrySource,
} from "@oss-health-checker/common/features/ecosystem-adoption/domain/models/adoption.js";
import { ApplicationError } from "@oss-health-checker/common/features/ecosystem-adoption/application/errors/application-error.js";

const sources = new Set<RegistrySource>([
  "npm",
  "maven-central",
  "pypi",
  "homebrew",
  "docker",
]);

const fetchStatuses = new Set<AdoptionSnapshot["fetchStatus"]>([
  "succeeded",
  "failed",
]);

export const parsePersistedRegistrySource = (value: string): RegistrySource => {
  if (sources.has(value as RegistrySource)) {
    return value as RegistrySource;
  }

  throw new ApplicationError(
    "INTERNAL_ERROR",
    "Invalid persisted adoption value",
    {
      cause: `unknown registry source: ${value}`,
    },
  );
};

export const parsePersistedFetchStatus = (
  value: string,
): AdoptionSnapshot["fetchStatus"] => {
  if (fetchStatuses.has(value as AdoptionSnapshot["fetchStatus"])) {
    return value as AdoptionSnapshot["fetchStatus"];
  }

  throw new ApplicationError(
    "INTERNAL_ERROR",
    "Invalid persisted adoption value",
    {
      cause: `unknown adoption fetch status: ${value}`,
    },
  );
};
