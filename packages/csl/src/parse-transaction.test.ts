import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { parseTransaction } from "./parse-transaction";

describe("parseTransaction", () => {
  const validTransactionHex =
    "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6";

  describe("with valid inputs", () => {
    it("should return Transaction object when input is valid hex string", () => {
      const result = parseTransaction(validTransactionHex);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Transaction);
      expect(result.to_hex()).toBe(validTransactionHex);
    });

    it("should return same Transaction object when input is already Transaction", () => {
      const transactionObject = Transaction.from_hex(validTransactionHex);
      const result = parseTransaction(transactionObject);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(transactionObject);
      expect(result.to_hex()).toBe(validTransactionHex);
    });
  });

  describe("with invalid inputs", () => {
    it("should return error for invalid hex string", () => {
      const result = parseTransaction("invalid_hex");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for empty string", () => {
      const result = parseTransaction("");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for hex string with wrong length", () => {
      const result = parseTransaction("84a500d90102");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for non-hex characters", () => {
      const result = parseTransaction(
        "gg500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6",
      );

      expect(isErr(result)).toBe(true);
    });
  });
});
