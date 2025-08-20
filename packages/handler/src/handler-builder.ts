import { objectSchema, stringSchema } from "@anvil-vault/utils";
import { type Result, isErr } from "trynot";
import { VaultError } from "./errors";
import type { AnyParams, HandlerAdapter } from "./handler-types";
import type { IVault } from "./types";

const vaultApiDef = {
  wallet: {
    method: "GET",
    input: objectSchema({
      userId: stringSchema(),
    }),
  },
  "sign-data": {
    method: "POST",
    input: objectSchema({
      userId: stringSchema(),
      payload: stringSchema(),
      externalAad: stringSchema({ optional: true }),
    }),
  },
  "sign-transaction": {
    method: "POST",
    input: objectSchema({
      userId: stringSchema(),
      transaction: stringSchema(),
    }),
  },
} as const;

export function createVaultHandler<TParams extends AnyParams, TContext, TResponse>(input: {
  vault: IVault;
  adapter: HandlerAdapter<TParams, TContext, TResponse>;
}) {
  return async (...args: TParams) => {
    const context = await input.adapter.getContext(...args);
    const response = await handleVaultRequest(context, input.vault, input.adapter);
    return input.adapter.sendResponse(context, response);
  };
}

export async function handleVaultRequest<TParams extends AnyParams, TContext, TResponse>(
  context: TContext,
  vault: IVault,
  adapter: HandlerAdapter<TParams, TContext, TResponse>,
): Promise<Result<{ response: unknown }, VaultError>> {
  try {
    const path = await adapter.getPath(context);
    const method = await adapter.getMethod(context);

    const pathParts = path.split("/").filter((p) => p.length > 0);

    if (pathParts.length < 3 || pathParts[0] !== "users") {
      return new VaultError({
        message: "Not found",
        statusCode: 404,
        cause: new Error(`Invalid path: ${path}`),
      });
    }

    const userId = pathParts[1];
    if (!userId) {
      return new VaultError({
        message: "Not found",
        statusCode: 404,
        cause: new Error(`Invalid path: ${path}`),
      });
    }

    const operation = pathParts[2] as keyof typeof vaultApiDef;

    const apiDef = vaultApiDef[operation];
    if (!apiDef) {
      return new VaultError({
        message: "Not found",
        statusCode: 404,
        cause: new Error(`Unknown operation: ${operation}`),
      });
    }

    if (method.toUpperCase() !== apiDef.method.toUpperCase()) {
      return new VaultError({
        message: "Method not allowed",
        statusCode: 405,
        cause: new Error(`Method ${method} not allowed for ${operation}`),
      });
    }

    let inputData: Record<string, unknown>;
    try {
      if (method.toUpperCase() === "GET") {
        inputData = await adapter.getQuery(context);
      } else {
        inputData = await adapter.getBody(context);
      }
    } catch {
      inputData = {};
    }

    Object.assign(inputData, { userId });

    const validationResult = apiDef.input.parse(inputData);
    if (isErr(validationResult)) {
      return new VaultError({
        message: `Bad request: ${validationResult.toString()}`,
        statusCode: 400,
        cause: validationResult,
      });
    }

    const input = validationResult;

    let result: Result<unknown, VaultError>;
    switch (operation) {
      case "wallet": {
        result = await vault.getWallet({ userId: input.userId });
        break;
      }
      case "sign-data": {
        const signDataInput = input as { userId: string; payload: string; externalAad?: string };
        result = await vault.signData({
          userId: signDataInput.userId,
          payload: signDataInput.payload,
          externalAad: signDataInput.externalAad,
        });
        break;
      }
      case "sign-transaction": {
        const signTxInput = input as { userId: string; transaction: string };
        result = await vault.signTransaction({
          userId: signTxInput.userId,
          transaction: signTxInput.transaction,
        });
        break;
      }
      default: {
        return new VaultError({
          message: "Not found",
          statusCode: 404,
          cause: new Error(`Unhandled operation: ${operation}`),
        });
      }
    }

    if (result instanceof VaultError) {
      return result;
    }

    if (isErr(result)) {
      return new VaultError({
        message: result.message || "Unknown error",
        statusCode: 500,
        cause: result,
      });
    }

    return {
      response: result,
    };
  } catch (error) {
    return new VaultError({
      message: "Internal server error",
      statusCode: 500,
      cause: error,
    });
  }
}
