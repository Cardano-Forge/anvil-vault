import { parseFromHex } from "@anvil-vault/utils";
import {
  FixedTransaction,
  PrivateKey,
  Transaction,
  TransactionWitnessSet,
  Vkeywitnesses,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { parseError, type Result, unwrap } from "trynot";

export type SignTransactionInput = {
  transaction: Transaction | FixedTransaction | string;
  privateKeys: Array<PrivateKey | string>;
};

type SignTransactionOutput = {
  signedTransaction: FixedTransaction;
  witnessSet: TransactionWitnessSet;
};

/**
 * Signs a transaction with the given private keys.
 */
export function signTransaction(input: SignTransactionInput): Result<SignTransactionOutput> {
  try {
    let fixedTx: FixedTransaction;
    if (input.transaction instanceof Transaction) {
      fixedTx = FixedTransaction.from_bytes(input.transaction.to_bytes());
    } else {
      fixedTx = unwrap(parseFromHex(input.transaction, FixedTransaction));
    }

    const vkeys = Vkeywitnesses.new();

    for (const privateKeyInput of input.privateKeys) {
      const nextIndex = fixedTx.witness_set().vkeys()?.len() ?? 0;
      const privateKey = unwrap(parseFromHex(privateKeyInput, PrivateKey));
      fixedTx.sign_and_add_vkey_signature(privateKey);
      const vkey = fixedTx.witness_set().vkeys()?.get(nextIndex);
      if (!vkey) {
        return new Error("Failed to sign transaction");
      }
      vkeys.add(vkey);
    }

    const witnessSet = TransactionWitnessSet.new();
    witnessSet.set_vkeys(vkeys);

    return {
      signedTransaction: fixedTx,
      witnessSet,
    };
  } catch (error) {
    return parseError(error);
  }
}
