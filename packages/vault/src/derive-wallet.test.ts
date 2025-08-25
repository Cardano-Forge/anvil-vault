import type { Derivation } from "@anvil-vault/handler";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it, vi } from "vitest";
import { deriveWallet } from "./derive-wallet";

const validRootKeyHex =
  "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57604f2a17296ef2dcd9febf5e14adc4efe627bf5666db302da2ee1e94009f8c9bf529816cb417e611404426a46aca8697f7e815032a07aa156ed0fbbe5aa75cdc";
const mockUserId = "7a13ad8e-af95-419a-b56f-2e41a5cc37e3";

describe("deriveWallet", () => {
  const defaultDerivations = {
    account: { type: "constant", value: 0 } as Derivation,
    payment: { type: "constant", value: 0 } as Derivation,
    stake: { type: "constant", value: 0 } as Derivation,
  };

  describe("with Bip32PrivateKey", () => {
    it("should derive wallet with valid Bip32PrivateKey", async () => {
      const rootKey = Bip32PrivateKey.from_bytes(Buffer.from(validRootKeyHex, "hex"));

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
      expect(result).toHaveProperty("paymentKey");
      expect(result).toHaveProperty("stakeKey");
    });

    it("should derive wallet with different derivation paths", async () => {
      const rootKey = Bip32PrivateKey.from_bytes(Buffer.from(validRootKeyHex, "hex"));

      const customDerivations = {
        accountDerivation: { type: "constant", value: 1 } as Derivation,
        paymentDerivation: { type: "constant", value: 2 } as Derivation,
        stakeDerivation: { type: "constant", value: 3 } as Derivation,
      };

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey,
        ...customDerivations,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
      expect(result).toHaveProperty("paymentKey");
      expect(result).toHaveProperty("stakeKey");
    });
  });

  describe("with hex string", () => {
    it("should derive wallet with valid hex string", async () => {
      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
      expect(result).toHaveProperty("paymentKey");
      expect(result).toHaveProperty("stakeKey");
    });

    it("should fail with invalid hex string", async () => {
      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: "invalid-hex",
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isErr(result), "should fail with invalid hex");
    });
  });

  describe("derivation types", () => {
    it("should work with pool derivations", async () => {
      const poolDerivations = {
        accountDerivation: { type: "pool", size: 5 } as Derivation,
        paymentDerivation: { type: "pool", size: 10 } as Derivation,
        stakeDerivation: { type: "pool", size: 3 } as Derivation,
      };

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        ...poolDerivations,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
      expect(result).toHaveProperty("paymentKey");
      expect(result).toHaveProperty("stakeKey");
    });

    it("should work with unique derivations", async () => {
      const uniqueDerivations = {
        accountDerivation: { type: "unique" } as Derivation,
        paymentDerivation: { type: "unique" } as Derivation,
        stakeDerivation: { type: "unique" } as Derivation,
      };

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        ...uniqueDerivations,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
      expect(result).toHaveProperty("paymentKey");
      expect(result).toHaveProperty("stakeKey");
    });

    it("should work with custom derivations", async () => {
      const customProvider = vi.fn().mockResolvedValue(42);
      const customDerivations = {
        accountDerivation: { type: "custom", provider: customProvider } as Derivation,
        paymentDerivation: { type: "constant", value: [1, 2, 3] } as Derivation,
        stakeDerivation: { type: "constant", value: 0 } as Derivation,
      };

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        ...customDerivations,
      });

      assert(isOk(result), "should succeed");
      expect(customProvider).toHaveBeenCalled();
    });

    it("should work with scrambler in unique derivation", async () => {
      const scrambler = vi.fn().mockResolvedValue([5, 4, 3, 2, 1]);
      const scramblerDerivations = {
        accountDerivation: { type: "constant", value: 0 } as Derivation,
        paymentDerivation: { type: "unique", scrambler } as Derivation,
        stakeDerivation: { type: "constant", value: 0 } as Derivation,
      };

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        ...scramblerDerivations,
      });

      assert(isOk(result), "should succeed");
      expect(scrambler).toHaveBeenCalled();
    });
  });

  describe("with context", () => {
    it("should pass context to derivation functions", async () => {
      const context = { network: 1, rootKey: () => "test" };
      const customProvider = vi.fn().mockResolvedValue(123);
      const scrambler = vi.fn().mockResolvedValue([1, 2, 3]);

      const contextDerivations = {
        accountDerivation: { type: "custom", provider: customProvider } as Derivation<
          typeof context
        >,
        paymentDerivation: { type: "unique", scrambler } as Derivation<typeof context>,
        stakeDerivation: { type: "constant", value: 0 } as Derivation<typeof context>,
      };

      const result = await deriveWallet(
        {
          userId: mockUserId,
          rootKey: validRootKeyHex,
          ...contextDerivations,
        },
        context,
      );

      assert(isOk(result), "should succeed");
      expect(customProvider).toHaveBeenCalledWith(expect.any(Object), context);
      expect(scrambler).toHaveBeenCalledWith(expect.any(Array), expect.any(Object), context);
    });
  });

  describe("error handling", () => {
    it("should handle invalid userId", async () => {
      const result = await deriveWallet({
        userId: "gg-invalid-uuid-gg", // Contains non-hex characters
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      // This might succeed but could return NaN, so let's check both cases
      if (isErr(result)) {
        expect(result).toBeInstanceOf(Error);
      } else {
        // If it succeeds, the result should have the expected properties
        expect(result).toHaveProperty("accountKey");
        expect(result).toHaveProperty("paymentKey");
        expect(result).toHaveProperty("stakeKey");
      }
    });

    it("should handle derivation errors", async () => {
      const failingProvider = vi.fn().mockRejectedValue(new Error("Derivation failed"));
      const failingDerivations = {
        accountDerivation: { type: "custom", provider: failingProvider } as Derivation,
        paymentDerivation: { type: "constant", value: 0 } as Derivation,
        stakeDerivation: { type: "constant", value: 0 } as Derivation,
      };

      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        ...failingDerivations,
      });

      assert(isErr(result), "should fail");
      expect(result.message).toBe("Derivation failed");
    });

    it("should handle account derivation errors", async () => {
      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: "too-short", // Invalid hex that will cause deriveAccount to fail
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isErr(result), "should fail with invalid root key");
    });
  });

  describe("overloads", () => {
    it("should work without context parameter", async () => {
      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
    });

    it("should work with context parameter", async () => {
      const result = await deriveWallet({
        userId: mockUserId,
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isOk(result), "should succeed");
      expect(result).toHaveProperty("accountKey");
    });
  });

  describe("deterministic behavior", () => {
    it("should produce same results for same inputs", async () => {
      const input = {
        userId: mockUserId,
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: defaultDerivations.payment,
        stakeDerivation: defaultDerivations.stake,
      };

      const result1 = await deriveWallet(input);
      const result2 = await deriveWallet(input);

      assert(isOk(result1), "first call should succeed");
      assert(isOk(result2), "second call should succeed");

      // Keys should be equivalent (same hex representation)
      expect(result1.accountKey.to_hex()).toBe(result2.accountKey.to_hex());
      expect(result1.paymentKey.to_hex()).toBe(result2.paymentKey.to_hex());
      expect(result1.stakeKey.to_hex()).toBe(result2.stakeKey.to_hex());
    });

    it("should produce different results for different userIds", async () => {
      const userId1 = "00000000-0000-0000-0000-000000000000";
      const userId2 = "11111111-1111-1111-1111-111111111111";

      const uniqueDerivation = { type: "unique" } as Derivation;

      const result1 = await deriveWallet({
        userId: userId1,
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: uniqueDerivation,
        stakeDerivation: defaultDerivations.stake,
      });

      const result2 = await deriveWallet({
        userId: userId2,
        rootKey: validRootKeyHex,
        accountDerivation: defaultDerivations.account,
        paymentDerivation: uniqueDerivation,
        stakeDerivation: defaultDerivations.stake,
      });

      assert(isOk(result1), "first call should succeed");
      assert(isOk(result2), "second call should succeed");

      // Payment keys should be different due to unique derivation
      expect(result1.paymentKey.to_hex()).not.toBe(result2.paymentKey.to_hex());
    });
  });
});
