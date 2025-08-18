import { parseFromHex } from "@anvil-vault/utils";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type ExtractKeysInput = {
  accountKey: Bip32PrivateKey | string;
  paymentDerivation?: number | number[];
  stakeDerivation?: number | number[];
};

export type ExtractKeysOutput = {
  accountKey: Bip32PrivateKey;
  paymentKey: Bip32PrivateKey;
  stakeKey: Bip32PrivateKey;
};

export function extractKeys(input: ExtractKeysInput): Result<ExtractKeysOutput> {
  try {
    const accountKey = unwrap(parseFromHex(input.accountKey, Bip32PrivateKey));

    let paymentDerivation: number[];
    if (Array.isArray(input.paymentDerivation)) {
      paymentDerivation = input.paymentDerivation;
    } else {
      paymentDerivation = [input.paymentDerivation ?? 0];
    }
    const paymentKey = paymentDerivation.reduce(
      (key, index) => key.derive(index),
      accountKey.derive(0), // External chain
    );

    let stakeDerivation: number[];
    if (Array.isArray(input.stakeDerivation)) {
      stakeDerivation = input.stakeDerivation;
    } else {
      stakeDerivation = [input.stakeDerivation ?? 0];
    }
    const stakeKey = stakeDerivation.reduce(
      (key, index) => key.derive(index),
      accountKey.derive(2), // Staking chain
    );

    return {
      accountKey,
      paymentKey,
      stakeKey,
    };
  } catch (error) {
    return parseError(error);
  }
}
