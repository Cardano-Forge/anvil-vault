import { parseFromHex } from "@anvil-vault/utils";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { parseError, type Result, unwrap } from "trynot";

export type DerivePrivateKeyInput = {
  entropy: Buffer | string;
  password?: Buffer | string;
};

export function derivePrivateKey(input: DerivePrivateKeyInput): Result<Bip32PrivateKey> {
  try {
    const entropy = unwrap(parseFromHex(input.entropy));
    const password = unwrap(parseFromHex(input.password ?? ""));

    return Bip32PrivateKey.from_bip39_entropy(entropy, password);
  } catch (error) {
    return parseError(error);
  }
}
