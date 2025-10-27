import type { HandlerAdapter } from "@anvil-vault/handler";
import { errorToJson } from "@anvil-vault/utils";
import type { Context, Env } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { isErr } from "trynot";

export type HonoAdapter<TEnv extends Env = Env> = HandlerAdapter<[c: Context<TEnv>], Context, void>;

export const honoAdapter: HonoAdapter = {
  getContext: (c) => c,
  getBody: (ctx) => ctx.req.json() || {},
  getMethod: (ctx) => ctx.req.method,
  getPath: (ctx) => ctx.req.path,
  getQuery: (ctx) => ctx.req.query(),
  sendResponse: (ctx, result) => {
    if (isErr(result)) {
      ctx.json(errorToJson(result), result.statusCode as ContentfulStatusCode);
    } else {
      ctx.json(result.response, 200);
    }
  },
};
