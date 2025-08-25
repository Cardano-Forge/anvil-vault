import type { HandlerAdapter } from "@anvil-vault/handler";
import type { Request, Response } from "express";
import { isErr, parseError } from "trynot";

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
      ctx.res.status(result.statusCode).json({
        error: errorToString(result) || "Internal server error",
      });
    } else {
      ctx.res.status(200).json(result.response);
    }
  },
};

function errorToString(error: unknown): string | undefined {
  if (typeof error === "string") {
    return error;
  }
  const parsed = parseError(error);
  if (!parsed.cause) {
    return parsed.message || undefined;
  }
  const cause = parseError(parsed.cause);
  if (!cause.message) {
    return parsed.message || undefined;
  }
  if (cause.message === parsed.message) {
    return errorToString(
      new Error(parsed.message, {
        cause: cause.cause,
      }),
    );
  }
  return `${parsed.message}: ${cause.message}`;
}
