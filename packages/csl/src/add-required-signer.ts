import {
  type Ed25519KeyHash,
  Ed25519KeyHashes,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { parseEd25519KeyHash } from "./parse-ed25519-key-hash";
import { parseTransaction } from "./parse-transaction";

export type AddRequiredSignerInput = {
  transaction: Transaction | string;
  keyHash: Ed25519KeyHash | string;
};

/**
 * Adds a required signer key hash to a transaction.
 */
export function addRequiredSigner(input: AddRequiredSignerInput): Result<Transaction> {
  try {
    const tx = unwrap(parseTransaction(input.transaction));
    const keyHash = unwrap(parseEd25519KeyHash(input.keyHash));
    const txBody = tx.body();
    const requiredSigners = txBody.required_signers() ?? Ed25519KeyHashes.new();
    requiredSigners.add(keyHash);
    txBody.set_required_signers(requiredSigners);
    return Transaction.new(txBody, tx.witness_set(), tx.auxiliary_data());
  } catch (error) {
    return parseError(error);
  }
}
