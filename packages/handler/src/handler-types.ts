import type { MaybePromise } from "@anvil-vault/utils";
import type { Result } from "trynot";
import type { VaultError } from "./errors";

// biome-ignore lint/suspicious/noExplicitAny: any params are fine
export type AnyParams = any[];

export type HandlerAdapter<TParams extends AnyParams, TContext, TResponse> = {
  getContext: (...args: TParams) => MaybePromise<TContext>;
  getBody: (context: TContext) => MaybePromise<Record<string, unknown>>;
  getMethod: (context: TContext) => MaybePromise<string>;
  getPath: (context: TContext) => MaybePromise<string>;
  getQuery: (context: TContext) => MaybePromise<Record<string, unknown>>;
  sendResponse: (
    context: TContext,
    result: Result<{ response: unknown }, VaultError>,
  ) => MaybePromise<TResponse>;
};

export function createHandlerAdapter<TParams extends AnyParams, TContext, TResponse>(
  adapter: HandlerAdapter<TParams, TContext, TResponse>,
): HandlerAdapter<TParams, TContext, TResponse> {
  return adapter;
}
