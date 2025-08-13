import { PrivateKey, PublicKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { generateEd25519KeyPair } from "./generate-ed25519-key-pair";

describe("generateEd25519KeyPair", () => {
  it("should generate a valid Ed25519 key pair", () => {
    const result = generateEd25519KeyPair();

    assert(isOk(result));
    expect(result.privateKey).toBeInstanceOf(PrivateKey);
    expect(result.publicKey).toBeInstanceOf(PublicKey);
  });

  it("should generate different key pairs on each call", () => {
    const result1 = generateEd25519KeyPair();
    const result2 = generateEd25519KeyPair();

    assert(isOk(result1));
    assert(isOk(result2));

    const privateKey1Bytes = result1.privateKey.as_bytes();
    const privateKey2Bytes = result2.privateKey.as_bytes();
    const publicKey1Bytes = result1.publicKey.as_bytes();
    const publicKey2Bytes = result2.publicKey.as_bytes();

    expect(privateKey1Bytes).not.toEqual(privateKey2Bytes);
    expect(publicKey1Bytes).not.toEqual(publicKey2Bytes);
  });

  it("should generate public key that corresponds to private key", () => {
    const result = generateEd25519KeyPair();

    assert(isOk(result));

    const derivedPublicKey = result.privateKey.to_public();
    const publicKeyBytes = result.publicKey.as_bytes();
    const derivedPublicKeyBytes = derivedPublicKey.as_bytes();

    expect(publicKeyBytes).toEqual(derivedPublicKeyBytes);
  });

  it("should generate keys with correct byte lengths", () => {
    const result = generateEd25519KeyPair();

    assert(isOk(result));

    const privateKeyBytes = result.privateKey.as_bytes();
    const publicKeyBytes = result.publicKey.as_bytes();

    expect(privateKeyBytes).toHaveLength(32);
    expect(publicKeyBytes).toHaveLength(32);
  });

  it("should generate keys that can be used for signing", () => {
    const result = generateEd25519KeyPair();

    assert(isOk(result));

    const testData = Buffer.from("test message", "utf8");
    const signature = result.privateKey.sign(testData);
    const isValid = result.publicKey.verify(testData, signature);

    expect(isValid).toBe(true);
  });
});
