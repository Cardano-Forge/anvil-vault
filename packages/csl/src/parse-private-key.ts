import { PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError } from "trynot";

/**
 * Parses a private key from a CSL PrivateKey or hex string.
 * @param privateKey - The private key to parse. Can be a CSL PrivateKey or a hex string.
 */
export function parsePrivateKey(privateKey: PrivateKey | string): Result<PrivateKey> {
  if (typeof privateKey !== "string") {
    return privateKey;
  }
  try {
    return PrivateKey.from_hex(privateKey);
  } catch (error) {
    return parseError(error);
  }
}
