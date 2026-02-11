import { z } from "zod";
import { ApplicationError } from "../../application/errors/application-error";
import {
  REPOSITORY_STATUSES,
  WARNING_REASON_KEYS,
  type RepositoryStatus,
  type WarningReasonKey,
} from "../../domain/models/status";

const PersistedStatusSchema = z.enum(REPOSITORY_STATUSES);
const PersistedWarningReasonSchema = z.enum(WARNING_REASON_KEYS);

const toInternalError = (cause: string): ApplicationError =>
  new ApplicationError("INTERNAL_ERROR", "Invalid persisted snapshot value", {
    cause,
  });

export const parsePersistedStatus = (value: string): RepositoryStatus => {
  const result = PersistedStatusSchema.safeParse(value);
  if (!result.success) {
    throw toInternalError(`unknown snapshot status: ${value}`);
  }

  return result.data;
};

export const parsePersistedWarningReason = (
  value: string,
): WarningReasonKey => {
  const result = PersistedWarningReasonSchema.safeParse(value);
  if (!result.success) {
    throw toInternalError(`unknown warning reason: ${value}`);
  }

  return result.data;
};
