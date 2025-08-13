import {
  Ed25519KeyHash,
  PrivateKey,
  Transaction,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { parseFromHex } from "./parse-from-hex";

describe("parseFromHex", () => {
  describe("with Transaction", () => {
    const validTransactionHex =
      "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6";

    it("should return Transaction object when input is valid hex string", () => {
      const result = parseFromHex(validTransactionHex, Transaction);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Transaction);
      expect(result.to_hex()).toBe(validTransactionHex);
    });

    it("should return same Transaction object when input is already Transaction", () => {
      const transactionObject = Transaction.from_hex(validTransactionHex);
      const result = parseFromHex(transactionObject, Transaction);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(transactionObject);
      expect(result.to_hex()).toBe(validTransactionHex);
    });

    it("should return error for invalid hex string", () => {
      const result = parseFromHex("invalid_hex", Transaction);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for empty string", () => {
      const result = parseFromHex("", Transaction);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for hex string with wrong length", () => {
      const result = parseFromHex("84a500d90102", Transaction);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for non-hex characters", () => {
      const result = parseFromHex(
        "gg500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6",
        Transaction,
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe("with PrivateKey", () => {
    const validPrivateKeyHex =
      "20989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383";

    it("should return PrivateKey object when input is valid hex string", () => {
      const result = parseFromHex(validPrivateKeyHex, PrivateKey);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(PrivateKey);
      expect(result.to_hex()).toBe(validPrivateKeyHex);
    });

    it("should return same PrivateKey object when input is already PrivateKey", () => {
      const privateKeyObject = PrivateKey.from_hex(validPrivateKeyHex);
      const result = parseFromHex(privateKeyObject, PrivateKey);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(privateKeyObject);
      expect(result.to_hex()).toBe(validPrivateKeyHex);
    });

    it("should return error for invalid hex string", () => {
      const result = parseFromHex("invalid_hex", PrivateKey);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for empty string", () => {
      const result = parseFromHex("", PrivateKey);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for hex string with wrong length", () => {
      const result = parseFromHex("20989a3592541cbd", PrivateKey);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for non-hex characters", () => {
      const result = parseFromHex(
        "gg989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383",
        PrivateKey,
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe("with Ed25519KeyHash", () => {
    const primaryKeyHashHex = "f724afc7718bdc0a2fe00cb23f4ec261dcd6278ed48d68ceac6877f8";
    const stakeKeyHashHex = "52f756ebf79d3094bb6ececb7ba140c14c03e84c72399ad2eafb7dc2";

    it("should return Ed25519KeyHash object when input is valid primary key hash hex string", () => {
      const result = parseFromHex(primaryKeyHashHex, Ed25519KeyHash);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Ed25519KeyHash);
      expect(result.to_hex()).toBe(primaryKeyHashHex);
    });

    it("should return Ed25519KeyHash object when input is valid stake key hash hex string", () => {
      const result = parseFromHex(stakeKeyHashHex, Ed25519KeyHash);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Ed25519KeyHash);
      expect(result.to_hex()).toBe(stakeKeyHashHex);
    });

    it("should return same Ed25519KeyHash object when input is already Ed25519KeyHash", () => {
      const keyHashObject = Ed25519KeyHash.from_hex(primaryKeyHashHex);
      const result = parseFromHex(keyHashObject, Ed25519KeyHash);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(keyHashObject);
      expect(result.to_hex()).toBe(primaryKeyHashHex);
    });

    it("should return error for invalid hex string", () => {
      const result = parseFromHex("invalid_hex", Ed25519KeyHash);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for empty string", () => {
      const result = parseFromHex("", Ed25519KeyHash);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for hex string with wrong length", () => {
      const result = parseFromHex("48dc188cd7", Ed25519KeyHash);

      expect(isErr(result)).toBe(true);
    });

    it("should return error for non-hex characters", () => {
      const result = parseFromHex(
        "gg188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c",
        Ed25519KeyHash,
      );

      expect(isErr(result)).toBe(true);
    });

    it("should return undefined when input is undefined", () => {
      const result = parseFromHex(undefined, Ed25519KeyHash);

      expect(result).toBe(undefined);
    });
  });

  describe("with Buffer (default constructor)", () => {
    const validHex = "deadbeef";

    it("should return Buffer when input is valid hex string and no constructor provided", () => {
      const result = parseFromHex(validHex);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString("hex")).toBe(validHex);
    });

    it("should return same Buffer when input is already Buffer and no constructor provided", () => {
      const buffer = Buffer.from(validHex, "hex");
      const result = parseFromHex(buffer);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(buffer);
      expect(result.toString("hex")).toBe(validHex);
    });

    it("should create Buffer even for invalid hex string with default constructor", () => {
      const result = parseFromHex("invalid_hex");

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe("");
    });

    it("should return undefined when input is undefined with default constructor", () => {
      const result = parseFromHex(undefined);

      expect(result).toBe(undefined);
    });
  });

  describe("undefined support with custom constructor", () => {
    it("should return undefined when Transaction input is undefined", () => {
      const result = parseFromHex(undefined, Transaction);

      expect(result).toBe(undefined);
    });

    it("should return undefined when PrivateKey input is undefined", () => {
      const result = parseFromHex(undefined, PrivateKey);

      expect(result).toBe(undefined);
    });
  });
});
