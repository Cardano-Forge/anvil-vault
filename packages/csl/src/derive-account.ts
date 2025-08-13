import { parseFromHex } from "@anvil-vault/utils";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type DeriveAccountInput = {
  rootKey: Bip32PrivateKey | string;
  accountIndex: number;
};

export type DeriveAccountOutput = {
  rootKey: Bip32PrivateKey;
  accountKey: Bip32PrivateKey;
};

export function deriveAccount(input: DeriveAccountInput): Result<DeriveAccountOutput> {
  try {
    const rootKey = unwrap(parseFromHex(input.rootKey, Bip32PrivateKey));
    const accountIndex = input.accountIndex;

    const accountKey = rootKey
      .derive(harden(1852)) // Purpose - CIP-1852
      .derive(harden(1815)) // Coin type - Cardano
      .derive(harden(accountIndex));

    return {
      rootKey,
      accountKey,
    };
  } catch (error) {
    return parseError(error);
  }
}

/** Adds 2^31 (0x80000000) to the number to indicate hardened derivation */
function harden(num: number): number {
  return 0x80000000 + num;
}
