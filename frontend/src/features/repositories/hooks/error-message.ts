type ResolveMutationErrorMessageInput = {
  isError: boolean;
  error: unknown;
  fallbackMessage: string;
};

export const resolveMutationErrorMessage = ({
  isError,
  error,
  fallbackMessage,
}: ResolveMutationErrorMessageInput): string | undefined => {
  if (!isError) {
    return undefined;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
};
