import type { Request, Response } from "express";
import { isErr } from "trynot";
import { createHandlerAdapter } from "./handler-types";

export const expressAdapter = createHandlerAdapter({
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
});

type JsonError = {
  message: string;
  cause?: JsonError;
};

function errorToJson(error: unknown): JsonError | undefined {
  if (error instanceof Error) {
    const res: JsonError = { message: error.message };
    const cause = errorToJson(error.cause);
    if (cause) {
      res.cause = cause;
    }
    return res;
  }
  return undefined;
}
