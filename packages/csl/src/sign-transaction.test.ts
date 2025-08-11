import {
  FixedTransaction,
  PrivateKey,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { type SignTransactionInput, signTransaction } from "./sign-transaction";

describe("signTransaction", () => {
  const validPrivateKeyHex =
    "20989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383";
  const secondPrivateKeyHex =
    "903ccff120c1fa04270b422397d81a9c999fae52fcf8c5f9f235517b9d526a5609d1a78516c587bb335605f999c1733e6ce0fc62c57cbf9fb512bb39bc7c48ad";
  const validTransactionHex =
    "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6";

  describe("with valid inputs", () => {
    it("should sign transaction with single private key as hex string", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [validPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      assert(vkeys, "vkeys should be present");
      expect(vkeys.length).toBe(1);
    });

    it("should sign transaction with multiple private keys as hex strings", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [validPrivateKeyHex, secondPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      assert(vkeys, "vkeys should be present");
      expect(vkeys.length).toBe(2);
    });

    it("should sign transaction with private key as CSL PrivateKey object", () => {
      const privateKey = PrivateKey.from_hex(validPrivateKeyHex);
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [privateKey],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      assert(vkeys, "vkeys should be present");
      expect(vkeys.length).toBe(1);
    });

    it("should sign transaction with transaction as CSL Transaction object", () => {
      const transaction = Transaction.from_hex(validTransactionHex);
      const input: SignTransactionInput = {
        transaction,
        privateKeys: [validPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      assert(vkeys, "vkeys should be present");
      expect(vkeys.length).toBe(1);
    });

    it("should sign transaction with transaction as CSL FixedTransaction object", () => {
      const fixedTransaction = FixedTransaction.from_hex(validTransactionHex);
      const input: SignTransactionInput = {
        transaction: fixedTransaction,
        privateKeys: [validPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      assert(vkeys, "vkeys should be present");
      expect(vkeys.length).toBe(1);
    });

    it("should not mutate the original transaction object", () => {
      const originalTransaction = Transaction.from_hex(validTransactionHex);
      const originalHex = originalTransaction.to_hex();

      const input: SignTransactionInput = {
        transaction: originalTransaction,
        privateKeys: [validPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(originalTransaction.to_hex()).toBe(originalHex);
    });

    it("should sign transaction with mixed private key types", () => {
      const privateKeyObject = PrivateKey.from_hex(validPrivateKeyHex);

      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [privateKeyObject, secondPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      assert(vkeys, "vkeys should be present");
      expect(vkeys.length).toBe(2);
    });
  });

  describe("with invalid inputs", () => {
    it("should return error for invalid transaction hex", () => {
      const input: SignTransactionInput = {
        transaction: "invalid_hex",
        privateKeys: [validPrivateKeyHex],
      };

      const result = signTransaction(input);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for invalid private key hex", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: ["invalid_private_key"],
      };

      const result = signTransaction(input);

      expect(isErr(result)).toBe(true);
    });

    it("should return error when one private key is invalid in array", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [validPrivateKeyHex, "invalid_key"],
      };

      const result = signTransaction(input);

      expect(isErr(result)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty private keys array", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(FixedTransaction);
      const vkeys = result.witness_set().vkeys()?.to_js_value();
      expect(vkeys?.length || 0).toBe(0);
    });
  });
});
