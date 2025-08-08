import {
  Ed25519KeyHash,
  Ed25519KeyHashes,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { parseFromHex } from "./parse-from-hex";

export type AddRequiredSignerInput = {
  transaction: Transaction | string;
  keyHash: Ed25519KeyHash | string;
};

/**
 * Adds a required signer key hash to a transaction.
 */
export function addRequiredSigner(input: AddRequiredSignerInput): Result<Transaction> {
  try {
    const tx = unwrap(parseFromHex(input.transaction, Transaction));
    const keyHash = unwrap(parseFromHex(input.keyHash, Ed25519KeyHash));
    const txBody = tx.body();
    const requiredSigners = txBody.required_signers() ?? Ed25519KeyHashes.new();
    requiredSigners.add(keyHash);
    txBody.set_required_signers(requiredSigners);
    return Transaction.new(txBody, tx.witness_set(), tx.auxiliary_data());
  } catch (error) {
    return parseError(error);
  }
}
