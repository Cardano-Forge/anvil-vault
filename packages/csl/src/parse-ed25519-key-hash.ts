import { Ed25519KeyHash } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError } from "trynot";

/**
 * Parses an Ed25519KeyHash from CSL object or hex string.
 */
export function parseEd25519KeyHash(keyHash: Ed25519KeyHash | string): Result<Ed25519KeyHash> {
  if (typeof keyHash !== "string") {
    return keyHash;
  }
  try {
    return Ed25519KeyHash.from_hex(keyHash);
  } catch (error) {
    return parseError(error);
  }
}
