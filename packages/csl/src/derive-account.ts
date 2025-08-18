import { parseFromHex } from "@anvil-vault/utils";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { harden } from "./harden";

export type DeriveAccountInput = {
  rootKey: Bip32PrivateKey | string;
  accountDerivation?: number | number[];
};

export type DeriveAccountOutput = {
  rootKey: Bip32PrivateKey;
  accountKey: Bip32PrivateKey;
};

export function deriveAccount(input: DeriveAccountInput): Result<DeriveAccountOutput> {
  try {
    const rootKey = unwrap(parseFromHex(input.rootKey, Bip32PrivateKey));

    let accountDerivation: number[];
    if (Array.isArray(input.accountDerivation)) {
      accountDerivation = input.accountDerivation;
    } else {
      accountDerivation = [input.accountDerivation ?? harden(0)];
    }

    const accountKey = accountDerivation.reduce(
      (acc, index) => acc.derive(harden(index)),
      rootKey
        .derive(harden(1852)) // Purpose - CIP-1852
        .derive(harden(1815)), // Coin type - Cardano
    );

    return {
      rootKey,
      accountKey,
    };
  } catch (error) {
    return parseError(error);
  }
}
