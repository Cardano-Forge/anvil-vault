import { parseFromHex } from "@anvil-vault/utils";
import {
  Ed25519KeyHash,
  Ed25519KeyHashes,
  FixedTransaction,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type TransactionInput = Transaction | FixedTransaction | string;

export type AddRequiredSignerInput<TTransaction extends TransactionInput = TransactionInput> = {
  transaction: TTransaction;
  keyHash: Ed25519KeyHash | string;
};

/**
 * Adds a required signer key hash to a transaction.
 */
export function addRequiredSigner(input: AddRequiredSignerInput<Transaction>): Result<Transaction>;
export function addRequiredSigner(
  input: AddRequiredSignerInput<FixedTransaction | string>,
): Result<FixedTransaction>;
export function addRequiredSigner(
  input: AddRequiredSignerInput,
): Result<Transaction | FixedTransaction>;
export function addRequiredSigner(
  input: AddRequiredSignerInput,
): Result<Transaction | FixedTransaction> {
  try {
    let tx: Transaction | FixedTransaction;
    if (input.transaction instanceof Transaction) {
      tx = input.transaction;
    } else {
      tx = unwrap(parseFromHex(input.transaction, FixedTransaction));
    }

    const keyHash = unwrap(parseFromHex(input.keyHash, Ed25519KeyHash));
    const txBody = tx.body();
    const requiredSigners = txBody.required_signers() ?? Ed25519KeyHashes.new();
    requiredSigners.add(keyHash);
    txBody.set_required_signers(requiredSigners);

    const updatedTx = Transaction.new(txBody, tx.witness_set(), tx.auxiliary_data());

    if (input.transaction instanceof Transaction) {
      return updatedTx;
    }

    return FixedTransaction.from_bytes(updatedTx.to_bytes());
  } catch (error) {
    return parseError(error);
  }
}
