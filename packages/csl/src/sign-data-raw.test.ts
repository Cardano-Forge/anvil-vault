import { Ed25519Signature, PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { signDataRaw } from "./sign-data-raw";

describe("signDataRaw", () => {
  const testPrivateKeyHex =
    "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd";
  const testPrivateKey = PrivateKey.from_hex(testPrivateKeyHex);

  it("should sign data with private key hex string", () => {
    const testData = Buffer.from("test message", "utf8");

    const result = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    assert(isOk(result));
    expect(result.signature).toBeInstanceOf(Ed25519Signature);
  });

  it("should sign data with PrivateKey instance", () => {
    const testData = Buffer.from("test message", "utf8");

    const result = signDataRaw({
      data: testData,
      privateKey: testPrivateKey,
    });

    assert(isOk(result));
    expect(result.signature).toBeInstanceOf(Ed25519Signature);
  });

  it("should sign string data", () => {
    const testData = "test message";

    const result = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    assert(isOk(result));
    expect(result.signature).toBeInstanceOf(Ed25519Signature);
  });

  it("should sign hex string data", () => {
    const testData = "48656c6c6f20576f726c64"; // "Hello World" in hex

    const result = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    assert(isOk(result));
    expect(result.signature).toBeInstanceOf(Ed25519Signature);
  });

  it("should produce consistent signatures for same input", () => {
    const testData = Buffer.from("test message", "utf8");

    const result1 = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    const result2 = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const signature1Bytes = result1.signature.to_bytes();
    const signature2Bytes = result2.signature.to_bytes();

    expect(signature1Bytes).toEqual(signature2Bytes);
  });

  it("should produce different signatures for different data", () => {
    const testData1 = Buffer.from("test message 1", "utf8");
    const testData2 = Buffer.from("test message 2", "utf8");

    const result1 = signDataRaw({
      data: testData1,
      privateKey: testPrivateKeyHex,
    });

    const result2 = signDataRaw({
      data: testData2,
      privateKey: testPrivateKeyHex,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const signature1Bytes = result1.signature.to_bytes();
    const signature2Bytes = result2.signature.to_bytes();

    expect(signature1Bytes).not.toEqual(signature2Bytes);
  });

  it("should produce different signatures for different private keys", () => {
    const testData = Buffer.from("test message", "utf8");
    const anotherPrivateKey = PrivateKey.generate_ed25519();

    const result1 = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    const result2 = signDataRaw({
      data: testData,
      privateKey: anotherPrivateKey,
    });

    assert(isOk(result1));
    assert(isOk(result2));

    const signature1Bytes = result1.signature.to_bytes();
    const signature2Bytes = result2.signature.to_bytes();

    expect(signature1Bytes).not.toEqual(signature2Bytes);
  });

  it("should return error for invalid private key hex", () => {
    const testData = Buffer.from("test message", "utf8");
    const invalidPrivateKeyHex = "invalid_hex";

    const result = signDataRaw({
      data: testData,
      privateKey: invalidPrivateKeyHex,
    });

    assert(isErr(result));
    expect(result).toBeInstanceOf(Error);
  });

  it("should return error for wrong length private key hex", () => {
    const testData = Buffer.from("test message", "utf8");
    const shortPrivateKeyHex = "a828b7def44b32d5944b6f57d7028333";

    const result = signDataRaw({
      data: testData,
      privateKey: shortPrivateKeyHex,
    });

    assert(isErr(result));
    expect(result).toBeInstanceOf(Error);
  });

  it("should handle empty data", () => {
    const testData = Buffer.alloc(0);

    const result = signDataRaw({
      data: testData,
      privateKey: testPrivateKeyHex,
    });

    assert(isOk(result));
    expect(result.signature).toBeInstanceOf(Ed25519Signature);
  });
});
