import { RepositoryApiError } from "../api/repository-api-adapter";

type ResolveApiErrorMessageInput = {
  isError: boolean;
  error: unknown;
  fallbackMessage: string;
};

/**
 * Resolves a user-facing error message from query/mutation state.
 *
 * Only domain-level errors (RepositoryApiError) have their message surfaced.
 * All other error types fall back to a stable generic string.
 */
export const resolveApiErrorMessage = ({
  isError,
  error,
  fallbackMessage,
}: ResolveApiErrorMessageInput): string | undefined => {
  if (!isError) {
    return undefined;
  }

  if (error instanceof RepositoryApiError) {
    return error.message;
  }

  return fallbackMessage;
};
