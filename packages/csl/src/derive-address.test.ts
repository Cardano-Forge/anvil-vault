import {
  BaseAddress,
  Bip32PrivateKey,
  EnterpriseAddress,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { deriveAddress } from "./derive-address";

describe("deriveAddress", () => {
  const testAccountKeyHex =
    "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd9fc433abb24af2650942557909a6edc0f07d280e70269efdc8a00ba51a290bb5";

  it("should derive address from account key hex string for mainnet", () => {
    const result = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 0,
      network: "mainnet",
    });

    assert(isOk(result));
    expect(result.accountKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.stakeKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.baseAddress).toBeInstanceOf(BaseAddress);
    expect(result.enterpriseAddress).toBeInstanceOf(EnterpriseAddress);
    expect(result.rewardAddress).toBeInstanceOf(RewardAddress);
  });

  it("should derive address from Bip32PrivateKey instance", () => {
    const accountKey = Bip32PrivateKey.from_bytes(Buffer.from(testAccountKeyHex, "hex"));
    const result = deriveAddress({
      accountKey,
      addressIndex: 0,
      network: "mainnet",
    });

    assert(isOk(result));
    expect(result.accountKey).toBe(accountKey);
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.stakeKey).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should derive different payment keys for different address indices", () => {
    const result1 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 0,
      network: "mainnet",
    });
    const result2 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 1,
      network: "mainnet",
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.paymentKey.as_bytes();
    const key2Bytes = result2.paymentKey.as_bytes();

    expect(key1Bytes).not.toEqual(key2Bytes);
  });

  it("should derive same stake key for different address indices", () => {
    const result1 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 0,
      network: "mainnet",
    });
    const result2 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 1,
      network: "mainnet",
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.stakeKey.as_bytes();
    const key2Bytes = result2.stakeKey.as_bytes();

    expect(key1Bytes).toEqual(key2Bytes);
  });

  it("should work with different network types", () => {
    const networks = ["mainnet", "preprod", "preview"] as const;

    for (const network of networks) {
      const result = deriveAddress({
        accountKey: testAccountKeyHex,
        addressIndex: 0,
        network,
      });

      assert(isOk(result));
      expect(result.baseAddress).toBeInstanceOf(BaseAddress);
      expect(result.enterpriseAddress).toBeInstanceOf(EnterpriseAddress);
      expect(result.rewardAddress).toBeInstanceOf(RewardAddress);
    }
  });

  it("should work with NetworkId numbers", () => {
    const result1 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 0,
      network: 0, // testnet
    });

    const result2 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 0,
      network: 1, // mainnet
    });

    assert(isOk(result1));
    assert(isOk(result2));

    // Addresses should be different for different networks
    const addr1Bytes = result1.baseAddress.to_address().to_bytes();
    const addr2Bytes = result2.baseAddress.to_address().to_bytes();
    expect(addr1Bytes).not.toEqual(addr2Bytes);
  });

  it("should derive same addresses for same inputs", () => {
    const result1 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 5,
      network: "mainnet",
    });
    const result2 = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 5,
      network: "mainnet",
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const addr1Bytes = result1.baseAddress.to_address().to_bytes();
    const addr2Bytes = result2.baseAddress.to_address().to_bytes();
    expect(addr1Bytes).toEqual(addr2Bytes);
  });

  it("should handle large address indices", () => {
    const result = deriveAddress({
      accountKey: testAccountKeyHex,
      addressIndex: 2147483647,
      network: "mainnet",
    });

    assert(isOk(result));
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
  });
});
