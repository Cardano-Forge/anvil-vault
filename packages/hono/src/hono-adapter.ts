import type { HandlerAdapter } from "@anvil-vault/handler";
import { errorToJson } from "@anvil-vault/utils";
import type { Context, Env } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { isErr } from "trynot";

export type HonoAdapter<TEnv extends Env = Env> = HandlerAdapter<
  [c: Context<TEnv>],
  Context,
  Response
>;

export const honoAdapter: HonoAdapter = {
  getContext: async (c) => c,
  getBody: async (ctx) => ctx.req.json() || {},
  getMethod: async (ctx) => ctx.req.method,
  getPath: async (ctx) => ctx.req.path,
  getQuery: async (ctx) => ctx.req.query(),
  sendResponse: async (ctx, result) => {
    if (isErr(result)) {
      return ctx.json(errorToJson(result), result.statusCode as ContentfulStatusCode);
    }
    return ctx.json(result.response, 200);
  },
};
