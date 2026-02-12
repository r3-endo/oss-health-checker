import { RepositoryApiError } from "../api/repository-api-adapter";

type ResolveMutationErrorMessageInput = {
  isError: boolean;
  error: unknown;
  fallbackMessage: string;
};

/**
 * Resolves a user-facing error message from a mutation result.
 *
 * Only domain-level errors ({@link RepositoryApiError}) have their message
 * surfaced to the UI. All other error types (ZodError, TypeError, network
 * failures, etc.) fall back to a stable generic string to prevent internal
 * diagnostic text from leaking into production UI.
 */
export const resolveMutationErrorMessage = ({
  isError,
  error,
  fallbackMessage,
}: ResolveMutationErrorMessageInput): string | undefined => {
  if (!isError) {
    return undefined;
  }

  if (error instanceof RepositoryApiError) {
    return error.message;
  }

  return fallbackMessage;
};
