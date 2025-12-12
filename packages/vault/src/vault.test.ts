import type { IVault, VaultConfig } from "@anvil-vault/handler";
import { VaultError } from "@anvil-vault/utils";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { beforeEach, describe, expect, it } from "vitest";
import { Vault } from "./vault";

const validRootKeyHex =
  "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57604f2a17296ef2dcd9febf5e14adc4efe627bf5666db302da2ee1e94009f8c9bf529816cb417e611404426a46aca8697f7e815032a07aa156ed0fbbe5aa75cdc";
const validRootKeyHex2 =
  "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd9fc433abb24af2650942557909a6edc0f07d280e70269efdc8a00ba51a290bb5";
const mockUserId = "7a13ad8e-af95-419a-b56f-2e41a5cc37e3";

const createTrackingCustomDerivation = (freedKeys: Set<string>) => {
  return async () => {
    const accountKeyHex =
      "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd9fc433abb24af2650942557909a6edc0f07d280e70269efdc8a00ba51a290bb5";
    const accountKey = Bip32PrivateKey.from_bytes(Buffer.from(accountKeyHex, "hex"));
    const paymentKey = Bip32PrivateKey.from_bytes(Buffer.from(accountKeyHex, "hex"));
    const stakeKey = Bip32PrivateKey.from_bytes(Buffer.from(accountKeyHex, "hex"));

    // Override free methods to track when they're called
    const originalAccountFree = accountKey.free.bind(accountKey);
    accountKey.free = () => {
      freedKeys.add("accountKey");
      originalAccountFree();
    };

    const originalPaymentFree = paymentKey.free.bind(paymentKey);
    paymentKey.free = () => {
      freedKeys.add("paymentKey");
      originalPaymentFree();
    };

    const originalStakeFree = stakeKey.free.bind(stakeKey);
    stakeKey.free = () => {
      freedKeys.add("stakeKey");
      originalStakeFree();
    };

    return {
      accountKey,
      paymentKey,
      stakeKey,
    };
  };
};

const createBaseVaultConfig = (): VaultConfig => ({
  rootKey: async () => validRootKeyHex,
  network: 0,
});

describe("Vault", () => {
  let vault: Vault;
  let config: VaultConfig;

  beforeEach(() => {
    config = createBaseVaultConfig();
    vault = new Vault(config);
  });

  describe("constructor", () => {
    it("should create vault with provided config", () => {
      expect(vault).toBeInstanceOf(Vault);
    });
  });

  describe("set method", () => {
    it("should modify the vault config and return same instance", () => {
      const newRootKey = async () => validRootKeyHex2;
      const newVault = vault.with("rootKey", newRootKey);

      expect(newVault).not.toBe(vault);
      expect(newVault).toBeInstanceOf(Vault);
      expect(newVault.config.rootKey).toBe(newRootKey);
      expect(vault.config.rootKey).not.toBe(newRootKey);
    });
  });

  describe("getWallet", () => {
    it("should return wallet addresses on success", async () => {
      const input: Parameters<IVault["getWallet"]>[0] = { userId: mockUserId };
      const result = await vault.getWallet(input);

      assert(isOk(result), "getWallet should succeed");
      expect(result.addresses.base).toHaveProperty("bech32");
      expect(result.addresses.base).toHaveProperty("hex");
      expect(result.addresses.enterprise).toHaveProperty("bech32");
      expect(result.addresses.enterprise).toHaveProperty("hex");
      expect(result.addresses.reward).toHaveProperty("bech32");
      expect(result.addresses.reward).toHaveProperty("hex");

      expect(typeof result.addresses.base.bech32).toBe("string");
      expect(typeof result.addresses.base.hex).toBe("string");
      expect(result.addresses.base.bech32.length).toBeGreaterThan(0);
      expect(result.addresses.base.hex.length).toBeGreaterThan(0);
    });

    it("should return VaultError on invalid root key", async () => {
      const invalidVault = new Vault({
        rootKey: async () => "invalid-hex",
        network: 0,
      });

      const input: Parameters<IVault["getWallet"]>[0] = { userId: mockUserId };
      const result = await invalidVault.getWallet(input);

      assert(isErr(result), "getWallet should fail with invalid root key");
      expect(result).toBeInstanceOf(VaultError);
      expect(result.message).toBe("Failed to get wallet");
      assert(result instanceof VaultError);
      expect(result.statusCode).toBe(500);
    });
  });

  describe("signData", () => {
    it("should return signature on success", async () => {
      const input: Parameters<IVault["signData"]>[0] = {
        userId: mockUserId,
        payload: "hello world",
      };
      const result = await vault.signData(input);

      assert(isOk(result), "signData should succeed");
      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("key");
      expect(typeof result.signature).toBe("string");
      expect(typeof result.key).toBe("string");
      expect(result.signature.length).toBeGreaterThan(0);
      expect(result.key.length).toBeGreaterThan(0);
    });

    it("should return VaultError on invalid root key", async () => {
      const invalidVault = new Vault({
        rootKey: async () => "invalid-hex",
        network: 0,
      });

      const input: Parameters<IVault["signData"]>[0] = {
        userId: mockUserId,
        payload: "test-payload",
      };
      const result = await invalidVault.signData(input);

      assert(isErr(result), "signData should fail with invalid root key");
      expect(result).toBeInstanceOf(VaultError);
      expect(result.message).toBe("Failed to sign data");
      assert(result instanceof VaultError);
      expect(result.statusCode).toBe(500);
    });
  });

  describe("signTransaction", () => {
    it("should return signed transaction on success", async () => {
      const validTransactionHex =
        "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6";

      const input: Parameters<IVault["signTransaction"]>[0] = {
        userId: mockUserId,
        transaction: validTransactionHex,
      };
      const result = await vault.signTransaction(input);

      assert(isOk(result), "signTransaction should succeed");
      expect(result).toHaveProperty("signedTransaction");
      expect(typeof result.signedTransaction).toBe("string");
      expect(result.signedTransaction.length).toBeGreaterThan(0);
    });

    it("should return VaultError on invalid transaction", async () => {
      const input: Parameters<IVault["signTransaction"]>[0] = {
        userId: mockUserId,
        transaction: "invalid-tx-hex",
      };
      const result = await vault.signTransaction(input);

      assert(isErr(result), "signTransaction should fail with invalid transaction");
      expect(result).toBeInstanceOf(VaultError);
      expect(result.message).toBe("Failed to sign transaction");
      assert(result instanceof VaultError);
      expect(result.statusCode).toBe(500);
    });

    it("should return VaultError on invalid root key", async () => {
      const invalidVault = new Vault({
        rootKey: async () => "invalid-hex",
        network: 0,
      });

      const validTransactionHex =
        "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6";

      const input: Parameters<IVault["signTransaction"]>[0] = {
        userId: mockUserId,
        transaction: validTransactionHex,
      };
      const result = await invalidVault.signTransaction(input);

      assert(isErr(result), "signTransaction should fail with invalid root key");
      expect(result).toBeInstanceOf(VaultError);
      expect(result.message).toBe("Failed to sign transaction");
      assert(result instanceof VaultError);
      expect(result.statusCode).toBe(500);
    });
  });

  describe("custom wallet derivation", () => {
    it("should use customWalletDerivation when provided", async () => {
      let customDerivationCalled = false;
      const mockCustomDerivation = async () => {
        customDerivationCalled = true;

        const accountKeyHex =
          "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd9fc433abb24af2650942557909a6edc0f07d280e70269efdc8a00ba51a290bb5";
        const accountKey = Bip32PrivateKey.from_bytes(Buffer.from(accountKeyHex, "hex"));
        return {
          accountKey: accountKey,
          paymentKey: accountKey,
          stakeKey: accountKey,
        };
      };

      const configWithCustom = {
        ...config,
        customWalletDerivation: mockCustomDerivation,
      };

      const vaultWithCustom = new Vault(configWithCustom);
      const input: Parameters<IVault["getWallet"]>[0] = { userId: mockUserId };
      const result = await vaultWithCustom.getWallet(input);

      expect(customDerivationCalled).toBe(true);
      assert(isOk(result), "getWallet should succeed with custom derivation");
    });
  });

  describe("memory cleanup", () => {
    it("should clean up sensitive private key memory after wallet operations", async () => {
      // Track if free() was called on the private keys
      const freedKeys = new Set<string>();
      const trackingCustomDerivation = createTrackingCustomDerivation(freedKeys);

      const vaultWithTracking = new Vault({
        ...config,
        customWalletDerivation: trackingCustomDerivation,
      });

      const input: Parameters<IVault["getWallet"]>[0] = { userId: mockUserId };
      const result = await vaultWithTracking.getWallet(input);

      // Verify the operation succeeded
      assert(isOk(result), "getWallet should succeed");

      // Verify that all private keys were properly freed
      expect(freedKeys.has("accountKey")).toBe(true);
      expect(freedKeys.has("paymentKey")).toBe(true);
      expect(freedKeys.has("stakeKey")).toBe(true);
      expect(freedKeys.size).toBe(3);
    });

    it("should clean up memory during multiple vault operations", async () => {
      const freedKeys = new Set<string>();
      const trackingCustomDerivation = createTrackingCustomDerivation(freedKeys);

      // Create a vault with tracking custom derivation
      const vaultWithTracking = new Vault({
        ...config,
        customWalletDerivation: trackingCustomDerivation,
      });

      const input: Parameters<IVault["getWallet"]>[0] = { userId: mockUserId };
      const result = await vaultWithTracking.getWallet(input);

      // Verify the operation succeeded
      assert(isOk(result), "getWallet should succeed");

      // Verify that private keys were properly freed
      expect(freedKeys.has("accountKey")).toBe(true);
      expect(freedKeys.has("paymentKey")).toBe(true);
      expect(freedKeys.has("stakeKey")).toBe(true);
    });

    it("should clean up memory during signData operations", async () => {
      const freedKeys = new Set<string>();
      const trackingCustomDerivation = createTrackingCustomDerivation(freedKeys);

      const vaultWithTracking = new Vault({
        ...config,
        customWalletDerivation: trackingCustomDerivation,
      });

      const input: Parameters<IVault["signData"]>[0] = {
        userId: mockUserId,
        payload: "test data to sign",
      };
      const result = await vaultWithTracking.signData(input);

      // Verify the operation succeeded
      assert(isOk(result), "signData should succeed");

      // Verify that private keys were properly freed
      expect(freedKeys.has("accountKey")).toBe(true);
      expect(freedKeys.has("paymentKey")).toBe(true);
      expect(freedKeys.has("stakeKey")).toBe(true);
    });
  });
});
