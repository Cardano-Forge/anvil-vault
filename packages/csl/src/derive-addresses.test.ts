import {
  BaseAddress,
  Bip32PrivateKey,
  EnterpriseAddress,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { deriveAddresses } from "./derive-addresses";
import { extractKeys } from "./extract-keys";
import { getNetworkId } from "./network";

describe("deriveAddresses", () => {
  const testAccountKeyHex =
    "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd9fc433abb24af2650942557909a6edc0f07d280e70269efdc8a00ba51a290bb5";

  it("should derive addresses from payment and stake key hex strings for mainnet", () => {
    const keysResult = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    assert(isOk(keysResult));

    const result = deriveAddresses({
      paymentKey: keysResult.paymentKey.to_hex(),
      stakeKey: keysResult.stakeKey.to_hex(),
      network: "mainnet",
    });

    assert(isOk(result));
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.stakeKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.baseAddress).toBeInstanceOf(BaseAddress);
    expect(result.enterpriseAddress).toBeInstanceOf(EnterpriseAddress);
    expect(result.rewardAddress).toBeInstanceOf(RewardAddress);
  });

  it("should derive addresses from Bip32PrivateKey instances", () => {
    const keysResult = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    assert(isOk(keysResult));

    const result = deriveAddresses({
      paymentKey: keysResult.paymentKey,
      stakeKey: keysResult.stakeKey,
      network: "mainnet",
    });

    assert(isOk(result));
    expect(result.paymentKey).toBe(keysResult.paymentKey);
    expect(result.stakeKey).toBe(keysResult.stakeKey);
    expect(result.baseAddress).toBeInstanceOf(BaseAddress);
    expect(result.enterpriseAddress).toBeInstanceOf(EnterpriseAddress);
    expect(result.rewardAddress).toBeInstanceOf(RewardAddress);
  });

  it("should derive different addresses for different payment keys", () => {
    const keys1Result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    const keys2Result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 1,
      stakeDerivation: 0,
    });
    assert(isOk(keys1Result));
    assert(isOk(keys2Result));

    const result1 = deriveAddresses({
      paymentKey: keys1Result.paymentKey,
      stakeKey: keys1Result.stakeKey,
      network: "mainnet",
    });
    const result2 = deriveAddresses({
      paymentKey: keys2Result.paymentKey,
      stakeKey: keys2Result.stakeKey,
      network: "mainnet",
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const addr1Bytes = result1.baseAddress.to_address().to_bytes();
    const addr2Bytes = result2.baseAddress.to_address().to_bytes();

    expect(addr1Bytes).not.toEqual(addr2Bytes);
  });

  it("should derive same addresses for same stake keys", () => {
    const keys1Result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    const keys2Result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 1,
      stakeDerivation: 0,
    });
    assert(isOk(keys1Result));
    assert(isOk(keys2Result));

    const result1 = deriveAddresses({
      paymentKey: keys1Result.paymentKey,
      stakeKey: keys1Result.stakeKey,
      network: "mainnet",
    });
    const result2 = deriveAddresses({
      paymentKey: keys2Result.paymentKey,
      stakeKey: keys2Result.stakeKey,
      network: "mainnet",
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const stake1Bytes = result1.rewardAddress.to_address().to_bytes();
    const stake2Bytes = result2.rewardAddress.to_address().to_bytes();

    expect(stake1Bytes).toEqual(stake2Bytes);
  });

  it("should work with different network types", () => {
    const networks = ["mainnet", "preprod", "preview"] as const;
    const keysResult = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    assert(isOk(keysResult));

    for (const network of networks) {
      const result = deriveAddresses({
        paymentKey: keysResult.paymentKey,
        stakeKey: keysResult.stakeKey,
        network,
      });

      const networkId = getNetworkId(network);

      assert(isOk(result));

      expect(result.baseAddress).toBeInstanceOf(BaseAddress);
      expect(result.enterpriseAddress).toBeInstanceOf(EnterpriseAddress);
      expect(result.rewardAddress).toBeInstanceOf(RewardAddress);

      expect(result.baseAddress.network_id()).toBe(networkId);
      expect(result.enterpriseAddress.network_id()).toBe(networkId);
      expect(result.rewardAddress.network_id()).toBe(networkId);
    }
  });

  it("should work with NetworkId numbers", () => {
    const keysResult = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    assert(isOk(keysResult));

    const result1 = deriveAddresses({
      paymentKey: keysResult.paymentKey,
      stakeKey: keysResult.stakeKey,
      network: 0, // testnet
    });

    const result2 = deriveAddresses({
      paymentKey: keysResult.paymentKey,
      stakeKey: keysResult.stakeKey,
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
    const keysResult = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 5,
      stakeDerivation: 0,
    });
    assert(isOk(keysResult));

    const result1 = deriveAddresses({
      paymentKey: keysResult.paymentKey,
      stakeKey: keysResult.stakeKey,
      network: "mainnet",
    });
    const result2 = deriveAddresses({
      paymentKey: keysResult.paymentKey,
      stakeKey: keysResult.stakeKey,
      network: "mainnet",
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const addr1Bytes = result1.baseAddress.to_address().to_bytes();
    const addr2Bytes = result2.baseAddress.to_address().to_bytes();
    expect(addr1Bytes).toEqual(addr2Bytes);
  });
});
