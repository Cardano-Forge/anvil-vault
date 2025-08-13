import { PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { signDataRaw } from "./sign-data";
import { verifySignature } from "./verify-signature";

describe("verifySignature", () => {
  const testPrivateKeyHex =
    "a828b7def44b32d5944b6f57d7028333b72e6b57a6bdd91d5146e82ca774ae57fe6db0227728d600869aed9ee50dbfea4ded4284a50bd1a4d08eb63f8fccf9fd";
  const testPrivateKey = PrivateKey.from_hex(testPrivateKeyHex);
  const testPublicKey = testPrivateKey.to_public();
  const testPublicKeyHex = Buffer.from(testPublicKey.as_bytes()).toString("hex");

  it("should verify valid signature with hex inputs", () => {
    const testData = Buffer.from("test message", "utf8");
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");

    const result = verifySignature({
      signature: signatureHex,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(true);
  });

  it("should verify valid signature with object instances", () => {
    const testData = Buffer.from("test message", "utf8");
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKey });
    assert(isOk(signResult));

    const result = verifySignature({
      signature: signResult.signature,
      publicKey: testPublicKey,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(true);
  });

  it("should verify signature with string data", () => {
    const testData = "test message";
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");

    const result = verifySignature({
      signature: signatureHex,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(true);
  });

  it("should verify signature with hex string data", () => {
    const testData = "48656c6c6f20576f726c64"; // "Hello World" in hex
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");

    const result = verifySignature({
      signature: signatureHex,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(true);
  });

  it("should reject invalid signature", () => {
    const testData = Buffer.from("test message", "utf8");
    const wrongData = Buffer.from("wrong message", "utf8");

    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");

    const result = verifySignature({
      signature: signatureHex,
      publicKey: testPublicKeyHex,
      data: wrongData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(false);
  });

  it("should reject signature with wrong public key", () => {
    const testData = Buffer.from("test message", "utf8");
    const wrongPrivateKey = PrivateKey.generate_ed25519();
    const wrongPublicKey = wrongPrivateKey.to_public();
    const wrongPublicKeyHex = Buffer.from(wrongPublicKey.as_bytes()).toString("hex");

    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");

    const result = verifySignature({
      signature: signatureHex,
      publicKey: wrongPublicKeyHex,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(false);
  });

  it("should reject completely invalid signature", () => {
    const testData = Buffer.from("test message", "utf8");
    const invalidSignature = "00".repeat(64); // Invalid signature

    const result = verifySignature({
      signature: invalidSignature,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(false);
  });

  it("should return error for invalid signature hex", () => {
    const testData = Buffer.from("test message", "utf8");
    const invalidSignatureHex = "invalid_hex";

    const result = verifySignature({
      signature: invalidSignatureHex,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isErr(result));
    expect(result).toBeInstanceOf(Error);
  });

  it("should return error for invalid public key hex", () => {
    const testData = Buffer.from("test message", "utf8");
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");
    const invalidPublicKeyHex = "invalid_hex";

    const result = verifySignature({
      signature: signatureHex,
      publicKey: invalidPublicKeyHex,
      data: testData,
    });

    assert(isErr(result));
    expect(result).toBeInstanceOf(Error);
  });

  it("should return error for wrong length signature hex", () => {
    const testData = Buffer.from("test message", "utf8");
    const shortSignatureHex = "a828b7def44b32d5944b6f57d7028333";

    const result = verifySignature({
      signature: shortSignatureHex,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isErr(result));
    expect(result).toBeInstanceOf(Error);
  });

  it("should return error for wrong length public key hex", () => {
    const testData = Buffer.from("test message", "utf8");
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");
    const shortPublicKeyHex = "a828b7def44b32d5944b6f57d7028333";

    const result = verifySignature({
      signature: signatureHex,
      publicKey: shortPublicKeyHex,
      data: testData,
    });

    assert(isErr(result));
    expect(result).toBeInstanceOf(Error);
  });

  it("should handle empty data", () => {
    const testData = Buffer.alloc(0);
    const signResult = signDataRaw({ data: testData, privateKey: testPrivateKeyHex });
    assert(isOk(signResult));

    const signatureHex = Buffer.from(signResult.signature.to_bytes()).toString("hex");

    const result = verifySignature({
      signature: signatureHex,
      publicKey: testPublicKeyHex,
      data: testData,
    });

    assert(isOk(result));
    expect(result.isValid).toBe(true);
  });

  it("should work with cross-function signature generation and verification", () => {
    const testData = Buffer.from("integration test message", "utf8");

    // Generate a new key pair
    const privateKey = PrivateKey.generate_ed25519();
    const publicKey = privateKey.to_public();

    // Sign data
    const signResult = signDataRaw({ data: testData, privateKey });
    assert(isOk(signResult));

    // Verify signature
    const verifyResult = verifySignature({
      signature: signResult.signature,
      publicKey,
      data: testData,
    });

    assert(isOk(verifyResult));
    expect(verifyResult.isValid).toBe(true);
  });
});
