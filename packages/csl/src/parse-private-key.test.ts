import { PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { parsePrivateKey } from "./parse-private-key";

describe("parsePrivateKey", () => {
  const validPrivateKeyHex =
    "20989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383";

  describe("with valid inputs", () => {
    it("should return PrivateKey object when input is valid hex string", () => {
      const result = parsePrivateKey(validPrivateKeyHex);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBeInstanceOf(PrivateKey);
      expect(result.to_hex()).toBe(validPrivateKeyHex);
    });

    it("should return same PrivateKey object when input is already PrivateKey", () => {
      const privateKeyObject = PrivateKey.from_hex(validPrivateKeyHex);
      const result = parsePrivateKey(privateKeyObject);

      assert(isOk(result), "Result should not be an error");
      expect(result).toBe(privateKeyObject);
      expect(result.to_hex()).toBe(validPrivateKeyHex);
    });
  });

  describe("with invalid inputs", () => {
    it("should return error for invalid hex string", () => {
      const result = parsePrivateKey("invalid_hex");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for empty string", () => {
      const result = parsePrivateKey("");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for hex string with wrong length", () => {
      const result = parsePrivateKey("20989a3592541cbd");

      expect(isErr(result)).toBe(true);
    });

    it("should return error for non-hex characters", () => {
      const result = parsePrivateKey(
        "gg989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383",
      );

      expect(isErr(result)).toBe(true);
    });
  });
});
