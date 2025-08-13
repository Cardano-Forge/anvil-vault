import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { deriveAccount } from "./derive-account";

describe("deriveAccount", () => {
  const testRootKeyHex =
    "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57604f2a17296ef2dcd9febf5e14adc4efe627bf5666db302da2ee1e94009f8c9bf529816cb417e611404426a46aca8697f7e815032a07aa156ed0fbbe5aa75cdc";

  it("should derive account key from root key hex string", () => {
    const result = deriveAccount({
      rootKey: testRootKeyHex,
      accountIndex: 0,
    });

    assert(isOk(result));
    expect(result.rootKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.accountKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.rootKey).not.toBe(result.accountKey);
  });

  it("should derive account key from Bip32PrivateKey instance", () => {
    const rootKey = Bip32PrivateKey.from_bytes(Buffer.from(testRootKeyHex, "hex"));
    const result = deriveAccount({
      rootKey,
      accountIndex: 0,
    });

    assert(isOk(result));
    expect(result.rootKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.accountKey).toBeInstanceOf(Bip32PrivateKey);
    expect(result.rootKey).toBe(rootKey);
  });

  it("should derive different account keys for different account indices", () => {
    const result1 = deriveAccount({
      rootKey: testRootKeyHex,
      accountIndex: 0,
    });
    const result2 = deriveAccount({
      rootKey: testRootKeyHex,
      accountIndex: 1,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.accountKey.as_bytes();
    const key2Bytes = result2.accountKey.as_bytes();

    expect(key1Bytes).not.toEqual(key2Bytes);
  });

  it("should derive same account key for same inputs", () => {
    const result1 = deriveAccount({
      rootKey: testRootKeyHex,
      accountIndex: 5,
    });
    const result2 = deriveAccount({
      rootKey: testRootKeyHex,
      accountIndex: 5,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.accountKey.as_bytes();
    const key2Bytes = result2.accountKey.as_bytes();

    expect(key1Bytes).toEqual(key2Bytes);
  });

  it("should handle large account indices", () => {
    const result = deriveAccount({
      rootKey: testRootKeyHex,
      accountIndex: 2147483647, // Maximum safe account index
    });

    assert(isOk(result));
    expect(result.accountKey).toBeInstanceOf(Bip32PrivateKey);
  });
});
