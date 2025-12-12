import type { VaultError } from "@anvil-vault/utils";
import type { Result } from "trynot";

// biome-ignore lint/suspicious/noExplicitAny: any params are fine
export type AnyParams = any[];

export type HandlerAdapter<TParams extends AnyParams, TContext, TResponse> = {
  getContext: (...args: TParams) => Promise<TContext>;
  getBody: (context: TContext) => Promise<Record<string, unknown>>;
  getMethod: (context: TContext) => Promise<string>;
  getPath: (context: TContext) => Promise<string>;
  getQuery: (context: TContext) => Promise<Record<string, unknown>>;
  sendResponse: (
    context: TContext,
    result: Result<{ response: unknown }, VaultError>,
  ) => Promise<TResponse>;
};

export function createHandlerAdapter<TParams extends AnyParams, TContext, TResponse>(
  adapter: HandlerAdapter<TParams, TContext, TResponse>,
): HandlerAdapter<TParams, TContext, TResponse> {
  return adapter;
}
