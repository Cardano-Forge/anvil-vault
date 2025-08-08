import {
  FixedTransaction,
  type PrivateKey,
  type Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { parsePrivateKey } from "./parse-private-key";
import { parseTransaction } from "./parse-transaction";

export type SignTransactionInput = {
  transaction: Transaction | string;
  privateKeys: Array<PrivateKey | string>;
};

/**
 * Signs a transaction with the given private keys.
 */
export function signTransaction(input: SignTransactionInput): Result<FixedTransaction> {
  try {
    const tx = unwrap(parseTransaction(input.transaction));
    const fixedTx = FixedTransaction.from_hex(tx.to_hex());
    for (const privateKeyInput of input.privateKeys) {
      const privateKey = unwrap(parsePrivateKey(privateKeyInput));
      fixedTx.sign_and_add_vkey_signature(privateKey);
    }
    return fixedTx;
  } catch (error) {
    return parseError(error);
  }
}
