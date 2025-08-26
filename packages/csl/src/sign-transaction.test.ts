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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
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
      expect(result.signedTransaction).toBeInstanceOf(FixedTransaction);
      expect(result.witnessSet).toBeDefined();
      const vkeys = result.witnessSet.vkeys()?.to_js_value();
      expect(vkeys?.length || 0).toBe(0);
    });
  });

  describe("witnessSet validation", () => {
    it("should return separate witnessSet with correct signature data", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [validPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();

      // Validate witness set contains correct number of signatures
      const witnessVkeys = result.witnessSet.vkeys()?.to_js_value();
      assert(witnessVkeys, "witness vkeys should be present");
      expect(witnessVkeys.length).toBe(1);

      // Validate signed transaction also has the same signatures
      const signedTxVkeys = result.signedTransaction.witness_set().vkeys()?.to_js_value();
      assert(signedTxVkeys, "signed transaction vkeys should be present");
      expect(signedTxVkeys.length).toBe(1);

      // Both witness sets should contain the same signature data
      expect(witnessVkeys[0].vkey).toBe(signedTxVkeys[0].vkey);
      expect(witnessVkeys[0].signature).toBe(signedTxVkeys[0].signature);
    });

    it("should return witnessSet with multiple signatures when multiple keys provided", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [validPrivateKeyHex, secondPrivateKeyHex],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result.witnessSet).toBeDefined();
      expect(result.witnessSet.vkeys()).toBeDefined();

      const witnessVkeys = result.witnessSet.vkeys()?.to_js_value();
      assert(witnessVkeys, "witness vkeys should be present");
      expect(witnessVkeys.length).toBe(2);

      // Each signature should have different vkey (public key)
      expect(witnessVkeys[0].vkey).not.toBe(witnessVkeys[1].vkey);
      expect(witnessVkeys[0].signature).not.toBe(witnessVkeys[1].signature);
    });

    it("should return empty witnessSet when no private keys provided", () => {
      const input: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [],
      };

      const result = signTransaction(input);

      assert(isOk(result), "Result should not be an error");
      expect(result.witnessSet).toBeDefined();

      const witnessVkeys = result.witnessSet.vkeys()?.to_js_value();
      expect(witnessVkeys?.length || 0).toBe(0);
    });

    it("should only include new signatures in witnessSet, not existing ones from partially signed transaction", () => {
      // First, create a partially signed transaction
      const firstSignInput: SignTransactionInput = {
        transaction: validTransactionHex,
        privateKeys: [validPrivateKeyHex],
      };

      const firstSignResult = signTransaction(firstSignInput);
      assert(isOk(firstSignResult), "First signing should not be an error");

      // Verify the first signature is present in the signed transaction
      const firstSignedTxVkeys = firstSignResult.signedTransaction
        .witness_set()
        .vkeys()
        ?.to_js_value();
      assert(firstSignedTxVkeys, "first signed transaction vkeys should be present");
      expect(firstSignedTxVkeys.length).toBe(1);
      const firstSignatureVkey = firstSignedTxVkeys[0].vkey;

      // Now sign the partially signed transaction with a second key
      const secondSignInput: SignTransactionInput = {
        transaction: firstSignResult.signedTransaction,
        privateKeys: [secondPrivateKeyHex],
      };

      const secondSignResult = signTransaction(secondSignInput);
      assert(isOk(secondSignResult), "Second signing should not be an error");

      // The final signed transaction should have both signatures
      const finalSignedTxVkeys = secondSignResult.signedTransaction
        .witness_set()
        .vkeys()
        ?.to_js_value();
      assert(finalSignedTxVkeys, "final signed transaction vkeys should be present");
      expect(finalSignedTxVkeys.length).toBe(2);

      // But the witnessSet should ONLY contain the new signature, not the existing one
      const witnessSetVkeys = secondSignResult.witnessSet.vkeys()?.to_js_value();
      assert(witnessSetVkeys, "witness set vkeys should be present");
      expect(witnessSetVkeys.length).toBe(1);

      // The witnessSet should not contain the first signature
      const witnessSetVkey = witnessSetVkeys[0].vkey;
      expect(witnessSetVkey).not.toBe(firstSignatureVkey);

      // Verify the witnessSet contains the second signature by checking it matches one of the final signatures
      const secondSignatureVkey = finalSignedTxVkeys.find(
        (vkey) => vkey.vkey !== firstSignatureVkey,
      )?.vkey;
      expect(witnessSetVkey).toBe(secondSignatureVkey);
    });
  });
});
