import { uuidToByteArray } from "@anvil-vault/utils";
import { parseError, type Result, unwrap } from "trynot";
import type { Derivation } from "./types";

export type GetDerivationInput<TContext = undefined> = {
  userId: string;
  derivation: Derivation<TContext>;
};

export async function getDerivation(input: GetDerivationInput): Promise<Result<number | number[]>>;
export async function getDerivation<TContext>(
  input: GetDerivationInput<TContext>,
  context: TContext,
): Promise<Result<number | number[]>>;
export async function getDerivation<TContext = undefined>(
  input: GetDerivationInput<TContext>,
  context?: TContext,
): Promise<Result<number | number[]>> {
  try {
    switch (input.derivation.type) {
      case "constant": {
        return input.derivation.value;
      }
      case "pool": {
        const poolSize = input.derivation.size;
        if (poolSize <= 0) {
          throw new Error("Pool size must be greater than 0");
        }
        const userIdBytes = unwrap(uuidToByteArray(input.userId));
        return Math.floor(userIdBytes.reduce((acc, byte) => acc + byte, 0) % poolSize);
      }
      case "unique": {
        const userIdBytes = unwrap(uuidToByteArray(input.userId));
        if (!input.derivation.scrambler) {
          return userIdBytes;
        }
        return await input.derivation.scrambler(userIdBytes, input, context as TContext);
      }
      case "custom": {
        const res = unwrap(await input.derivation.provider(input, context as TContext));
        if (typeof res === "number" || Array.isArray(res)) {
          return res;
        }
        return await getDerivation({ userId: input.userId, derivation: res }, context as TContext);
      }
    }
  } catch (error) {
    return parseError(error);
  }
}
