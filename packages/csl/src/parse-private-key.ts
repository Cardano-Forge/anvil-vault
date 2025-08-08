import { PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError } from "trynot";

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
