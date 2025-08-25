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
  getContext: (req: Request, res: Response) => ({ req, res }),
  getBody: (ctx) => ctx.req.body || {},
  getMethod: (ctx) => ctx.req.method,
  getPath: (ctx) => ctx.req.path,
  getQuery: (ctx) => ctx.req.query as Record<string, unknown>,
  sendResponse: (ctx, result) => {
    if (isErr(result)) {
      ctx.res.status(result.statusCode).json(errorToJson(result));
    } else {
      ctx.res.status(200).json(result.response);
    }
  },
};
