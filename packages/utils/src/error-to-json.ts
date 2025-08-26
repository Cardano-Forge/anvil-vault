import { errorToString } from "./error-to-string";
import { VaultError } from "./vault-error";

export type ErrorToJsonOpts = {
  defaultStatusCode?: number;
  defaultError?: string;
};

export type ErrorToJsonOutput = {
  statusCode: number;
  error: string;
};

export function errorToJson(error: unknown, opts?: ErrorToJsonOpts): ErrorToJsonOutput {
  const defaultError = opts?.defaultError ?? "Internal server error";
  const defaultStatusCode = opts?.defaultStatusCode ?? 500;
  return {
    statusCode: error instanceof VaultError ? error.statusCode : defaultStatusCode,
    error: errorToString(error) ?? defaultError,
  };
}
