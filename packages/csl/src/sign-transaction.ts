import {
  FixedTransaction,
  PrivateKey,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { parseFromHex } from "./parse-from-hex";

export type SignTransactionInput = {
  transaction: Transaction | string;
  privateKeys: Array<PrivateKey | string>;
};

/**
 * Signs a transaction with the given private keys.
 */
export function signTransaction(input: SignTransactionInput): Result<FixedTransaction> {
  try {
    const tx = unwrap(parseFromHex(input.transaction, Transaction));
    const fixedTx = FixedTransaction.from_hex(tx.to_hex());
    for (const privateKeyInput of input.privateKeys) {
      const privateKey = unwrap(parseFromHex(privateKeyInput, PrivateKey));
      fixedTx.sign_and_add_vkey_signature(privateKey);
    }
    return fixedTx;
  } catch (error) {
    return parseError(error);
  }
}
