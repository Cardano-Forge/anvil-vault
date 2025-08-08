import { Ed25519KeyHash } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { parseEd25519KeyHash } from "./parse-ed25519-key-hash";

describe("parseEd25519KeyHash", () => {
  describe("with valid primary key hash", () => {
    const primaryKeyHashHex = "f724afc7718bdc0a2fe00cb23f4ec261dcd6278ed48d68ceac6877f8";
    it("should return Ed25519KeyHash object when input is valid hex string", () => {
      const result = parseEd25519KeyHash(primaryKeyHashHex);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Ed25519KeyHash);
      expect(result.to_hex()).toBe(primaryKeyHashHex);
    });

    it("should return same Ed25519KeyHash object when input is already Ed25519KeyHash", () => {
      const keyHashObject = Ed25519KeyHash.from_hex(primaryKeyHashHex);
      const result = parseEd25519KeyHash(keyHashObject);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(keyHashObject);
      expect(result.to_hex()).toBe(primaryKeyHashHex);
    });
  });

  describe("with valid stake key hash", () => {
    const stakeKeyHashHex = "52f756ebf79d3094bb6ececb7ba140c14c03e84c72399ad2eafb7dc2";
    it("should return Ed25519KeyHash object when input is valid hex string", () => {
      const result = parseEd25519KeyHash(stakeKeyHashHex);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(Ed25519KeyHash);
      expect(result.to_hex()).toBe(stakeKeyHashHex);
    });

    it("should return same Ed25519KeyHash object when input is already Ed25519KeyHash", () => {
      const keyHashObject = Ed25519KeyHash.from_hex(stakeKeyHashHex);
      const result = parseEd25519KeyHash(keyHashObject);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(keyHashObject);
      expect(result.to_hex()).toBe(stakeKeyHashHex);
    });
  });

  describe("with invalid inputs", () => {
    it("should return error for invalid hex string", () => {
      const result = parseEd25519KeyHash("invalid_hex");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for empty string", () => {
      const result = parseEd25519KeyHash("");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for hex string with wrong length", () => {
      const result = parseEd25519KeyHash("48dc188cd7");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for non-hex characters", () => {
      const result = parseEd25519KeyHash(
        "gg188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c",
      );

      expect(isErr(result)).toBe(true);
    });
  });
});
