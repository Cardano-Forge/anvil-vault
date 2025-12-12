import type { HandlerAdapter } from "@anvil-vault/handler";
import { errorToJson } from "@anvil-vault/utils";
import type { Request, Response } from "express";
import { isErr } from "trynot";

export type ExpressAdapter = HandlerAdapter<
  [req: Request, res: Response],
  { req: Request; res: Response },
  void
>;

export const expressAdapter: ExpressAdapter = {
  getContext: async (req: Request, res: Response) => ({ req, res }),
  getBody: async (ctx) => ctx.req.body || {},
  getMethod: async (ctx) => ctx.req.method,
  getPath: async (ctx) => ctx.req.path,
  getQuery: async (ctx) => ctx.req.query as Record<string, unknown>,
  sendResponse: async (ctx, result) => {
    if (isErr(result)) {
      ctx.res.status(result.statusCode).json(errorToJson(result));
    } else {
      ctx.res.status(200).json(result.response);
    }
  },
};
