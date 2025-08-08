import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError } from "trynot";

/**
 * Parses a transaction from a CSL Transaction or hex string.
 * @param transaction - The transaction to parse. Can be a CSL Transaction or a hex string.
 */
export function parseTransaction(transaction: Transaction | string): Result<Transaction> {
  if (typeof transaction !== "string") {
    return transaction;
  }
  try {
    return Transaction.from_hex(transaction);
  } catch (error) {
    return parseError(error);
  }
}
