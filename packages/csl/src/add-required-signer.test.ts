import {
  Ed25519KeyHash,
  FixedTransaction,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { addRequiredSigner } from "./add-required-signer";

describe("addRequiredSigner", () => {
  const validTransactionHex =
    "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6";
  const validKeyHashHex = "f724afc7718bdc0a2fe00cb23f4ec261dcd6278ed48d68ceac6877f8";

  describe("with valid inputs", () => {
    it("should add required signer when transaction is hex string and keyHash is hex string", () => {
      const result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: validKeyHashHex,
      });

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(1);
      expect(requiredSigners.get(0).to_hex()).toBe(validKeyHashHex);
    });

    it("should add required signer when transaction is Transaction object and keyHash is hex string", () => {
      const transaction = Transaction.from_hex(validTransactionHex);
      const result = addRequiredSigner({
        transaction,
        keyHash: validKeyHashHex,
      });

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Transaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(1);
      expect(requiredSigners.get(0).to_hex()).toBe(validKeyHashHex);
    });

    it("should add required signer when transaction is hex string and keyHash is Ed25519KeyHash object", () => {
      const keyHashObject = Ed25519KeyHash.from_hex(validKeyHashHex);
      const result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: keyHashObject,
      });

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(1);
      expect(requiredSigners.get(0).to_hex()).toBe(validKeyHashHex);
    });

    it("should add required signer when both transaction and keyHash are objects", () => {
      const transaction = Transaction.from_hex(validTransactionHex);
      const keyHashObject = Ed25519KeyHash.from_hex(validKeyHashHex);
      const result = addRequiredSigner({
        transaction,
        keyHash: keyHashObject,
      });

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Transaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(1);
      expect(requiredSigners.get(0).to_hex()).toBe(validKeyHashHex);
    });

    it("should add required signer when transaction is FixedTransaction and keyHash is hex string", () => {
      const fixedTransaction = FixedTransaction.from_hex(validTransactionHex);
      const result = addRequiredSigner({
        transaction: fixedTransaction,
        keyHash: validKeyHashHex,
      });

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(1);
      expect(requiredSigners.get(0).to_hex()).toBe(validKeyHashHex);
    });

    it("should add multiple required signers when called multiple times", () => {
      const firstKeyHash = "f724afc7718bdc0a2fe00cb23f4ec261dcd6278ed48d68ceac6877f8";
      const secondKeyHash = "52f756ebf79d3094bb6ececb7ba140c14c03e84c72399ad2eafb7dc2";

      let result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: firstKeyHash,
      });

      assert(isOk(result), "First addition should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      result = addRequiredSigner({
        transaction: result,
        keyHash: secondKeyHash,
      });

      assert(isOk(result), "Second addition should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(2);
      expect(requiredSigners.get(0).to_hex()).toBe(firstKeyHash);
      expect(requiredSigners.get(1).to_hex()).toBe(secondKeyHash);
    });

    it("should not duplicate required signers when adding the same keyHash twice", () => {
      let result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: validKeyHashHex,
      });

      assert(isOk(result), "First addition should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      result = addRequiredSigner({
        transaction: result,
        keyHash: validKeyHashHex,
      });

      assert(isOk(result), "Second addition should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);

      const requiredSigners = result.body().required_signers();
      assert(requiredSigners, "Required signers should be defined");
      expect(requiredSigners.len()).toBe(1);
      expect(requiredSigners.get(0).to_hex()).toBe(validKeyHashHex);
    });

    it("should not mutate the original transaction object", () => {
      const originalTransaction = Transaction.from_hex(validTransactionHex);
      const originalRequiredSigners = originalTransaction.body().required_signers();
      const originalRequiredSignersLen = originalRequiredSigners?.len() ?? 0;
      const originalTransactionHex = originalTransaction.to_hex();

      const result = addRequiredSigner({
        transaction: originalTransaction,
        keyHash: validKeyHashHex,
      });

      assert(isOk(result), "Result should not be an error");

      // Verify original transaction object is unchanged
      const currentRequiredSigners = originalTransaction.body().required_signers();
      expect(currentRequiredSigners?.len() ?? 0).toBe(originalRequiredSignersLen);
      expect(originalTransaction.to_hex()).toBe(originalTransactionHex);

      // Verify the result has the required signer and is a different object
      expect(result).not.toBe(originalTransaction);
      const resultRequiredSigners = result.body().required_signers();
      assert(resultRequiredSigners, "Result should have required signers");
      expect(resultRequiredSigners.len()).toBe(1);
    });
  });

  describe("with invalid inputs", () => {
    it("should return error when transaction is invalid hex string", () => {
      const result = addRequiredSigner({
        transaction: "invalid_hex",
        keyHash: validKeyHashHex,
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when transaction is empty string", () => {
      const result = addRequiredSigner({
        transaction: "",
        keyHash: validKeyHashHex,
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when keyHash is invalid hex string", () => {
      const result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: "invalid_key_hash",
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when keyHash is empty string", () => {
      const result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: "",
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when keyHash has wrong length", () => {
      const result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: "48dc188cd7",
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when both transaction and keyHash are invalid", () => {
      const result = addRequiredSigner({
        transaction: "invalid_transaction",
        keyHash: "invalid_key_hash",
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when transaction hex has non-hex characters", () => {
      const result = addRequiredSigner({
        transaction:
          "gg500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6",
        keyHash: validKeyHashHex,
      });

      expect(isErr(result)).toBe(true);
    });

    it("should return error when keyHash has non-hex characters", () => {
      const result = addRequiredSigner({
        transaction: validTransactionHex,
        keyHash: "gg24afc7718bdc0a2fe00cb23f4ec261dcd6278ed48d68ceac6877f8",
      });

      expect(isErr(result)).toBe(true);
    });
  });
});
