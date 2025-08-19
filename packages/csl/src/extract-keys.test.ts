import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { extractKeys } from "./extract-keys";

describe("extractKeys", () => {
  const testAccountKeyHex =
    "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd9fc433abb24af2650942557909a6edc0f07d280e70269efdc8a00ba51a290bb5";

  it("should extract keys from account key hex string", () => {
    const result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });

    assert(isOk(result));
    expect(result.accountKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.stakeKey).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should extract keys from Bip32PrivateKey instance", () => {
    const accountKey = Bip32PrivateKey.from_bytes(Buffer.from(testAccountKeyHex, "hex"));
    const result = extractKeys({
      accountKey,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });

    assert(isOk(result));
    expect(result.accountKey).toBe(accountKey);
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.stakeKey).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should derive different payment keys for different payment indices", () => {
    const result1 = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    const result2 = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 1,
      stakeDerivation: 0,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.paymentKey.as_bytes();
    const key2Bytes = result2.paymentKey.as_bytes();

    expect(key1Bytes).not.toEqual(key2Bytes);
  });

  it("should derive different stake keys for different stake indices", () => {
    const result1 = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 0,
    });
    const result2 = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 1,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.stakeKey.as_bytes();
    const key2Bytes = result2.stakeKey.as_bytes();

    expect(key1Bytes).not.toEqual(key2Bytes);
  });

  it("should derive same keys for same inputs", () => {
    const result1 = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 5,
      stakeDerivation: 3,
    });
    const result2 = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 5,
      stakeDerivation: 3,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const payment1Bytes = result1.paymentKey.as_bytes();
    const payment2Bytes = result2.paymentKey.as_bytes();
    const stake1Bytes = result1.stakeKey.as_bytes();
    const stake2Bytes = result2.stakeKey.as_bytes();

    expect(payment1Bytes).toEqual(payment2Bytes);
    expect(stake1Bytes).toEqual(stake2Bytes);
  });

  it("should handle large indices", () => {
    const result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 2147483647,
      stakeDerivation: 2147483647,
    });

    assert(isOk(result));
    expect(result.paymentKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.stakeKey).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should derive payment key from external chain (index 0)", () => {
    const result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 5,
      stakeDerivation: 0,
    });

    assert(isOk(result));

    // Manually derive to verify the derivation path
    const accountKey = Bip32PrivateKey.from_bytes(Buffer.from(testAccountKeyHex, "hex"));
    const expectedPaymentKey = accountKey.derive(0).derive(5); // External chain (0), then address index (5)

    expect(result.paymentKey.as_bytes()).toEqual(expectedPaymentKey.as_bytes());
  });

  it("should derive stake key from staking chain (index 2)", () => {
    const result = extractKeys({
      accountKey: testAccountKeyHex,
      paymentDerivation: 0,
      stakeDerivation: 3,
    });

    assert(isOk(result));

    // Manually derive to verify the derivation path
    const accountKey = Bip32PrivateKey.from_bytes(Buffer.from(testAccountKeyHex, "hex"));
    const expectedStakeKey = accountKey.derive(2).derive(3); // Staking chain (2), then stake index (3)

    expect(result.stakeKey.as_bytes()).toEqual(expectedStakeKey.as_bytes());
  });
});
