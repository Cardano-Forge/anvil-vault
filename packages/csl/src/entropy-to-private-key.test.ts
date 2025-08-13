import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { entropyToBip32PrivateKey } from "./entropy-to-private-key";

describe("entropyToBip32PrivateKey", () => {
  const entropy1Hex = "6b9564ffeddff69a1a95ce37f8380fc1ecba18a27dc5b7d510c5b419da9f1d00";
  const entropy2Hex = "82a154600e1a13055253aa4a40e014d20f823b3afa27adeac118b1e5a557e44b";
  it("should derive a private key from entropy hex", () => {
    const entropy = entropy1Hex;
    const result = entropyToBip32PrivateKey({ entropy });

    assert(isOk(result));
    expect(result).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should derive a private key from entropy buffer", () => {
    const entropy = Buffer.from(entropy1Hex, "hex");
    const result = entropyToBip32PrivateKey({ entropy });

    assert(isOk(result));
    expect(result).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should derive a private key with password buffer", () => {
    const entropy = entropy1Hex;
    const password = Buffer.from("test123", "utf8");
    const result = entropyToBip32PrivateKey({ entropy, password });

    assert(isOk(result));
    expect(result).toBeInstanceOf(Bip32PrivateKey);
  });

  it("should derive different keys for different entropies", () => {
    const result1 = entropyToBip32PrivateKey({ entropy: entropy1Hex });
    const result2 = entropyToBip32PrivateKey({ entropy: entropy2Hex });

    assert(isOk(result1));
    assert(isOk(result2));

    const key1Bytes = result1.as_bytes();
    const key2Bytes = result2.as_bytes();

    expect(key1Bytes).not.toEqual(key2Bytes);
  });

  it("should derive a private key with password", () => {
    const entropy = entropy1Hex;
    const password = "password123";
    const result = entropyToBip32PrivateKey({ entropy, password });

    assert(isOk(result));
    expect(result).toBeInstanceOf(Bip32PrivateKey);
  });
});
