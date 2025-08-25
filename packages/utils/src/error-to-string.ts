import { getFailureReason } from "trynot";

export type ErrorToStringOpts = {
  cause?: boolean;
};

export function errorToString(error: unknown, opts?: ErrorToStringOpts): string | undefined {
  if (typeof error === "string") {
    return error;
  }
  if (!(error instanceof Error)) {
    return getFailureReason(error);
  }
  const errorMessage = error.message || undefined;
  const shouldIncludeCause = opts?.cause ?? true;
  if (!shouldIncludeCause) {
    return errorMessage;
  }
  const cause = getFailureReason(error.cause);
  if (!cause) {
    return errorMessage;
  }
  // If the error message is the same as the cause message,
  // we recursively go through the nested cause until we find a different message
  if (cause === errorMessage && error.cause instanceof Error && error.cause.cause) {
    return errorToString(
      new Error(errorMessage, {
        cause: error.cause.cause,
      }),
    );
  }
  if (cause === errorMessage) {
    return errorMessage;
  }
  return `${error.message}: ${cause}`;
}
