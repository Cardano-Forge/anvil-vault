import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError } from "trynot";

/**
 * Parses a transaction from CSL object or hex string.
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
