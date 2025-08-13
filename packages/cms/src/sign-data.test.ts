import type { ParsedAddress } from "@anvil-vault/csl";
import {
  CBORValue,
  COSEKey,
  COSESign1,
  Int,
  Label,
} from "@emurgo/cardano-message-signing-nodejs-gc";
import {
  BaseAddress,
  Credential,
  Ed25519Signature,
  EnterpriseAddress,
  PrivateKey,
  RewardAddress,
  ScriptHash,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, type Result, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { type SignDataOutput, signData } from "./sign-data";

describe("signData", () => {
  const paymentPrivateKeyHex =
    "20989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383";
  const paymentPrivateKey = PrivateKey.from_hex(paymentPrivateKeyHex);
  const paymentCred = Credential.from_keyhash(paymentPrivateKey.to_public().hash());

  const stakePrivateKeyHex =
    "903ccff120c1fa04270b422397d81a9c999fae52fcf8c5f9f235517b9d526a5609d1a78516c587bb335605f999c1733e6ce0fc62c57cbf9fb512bb39bc7c48ad";
  const stakePrivateKey = PrivateKey.from_hex(stakePrivateKeyHex);
  const stakeCred = Credential.from_keyhash(stakePrivateKey.to_public().hash());

  it("should sign data with enterprise address", () => {
    const address = EnterpriseAddress.new(1, paymentCred);
    const payload = "hello world";
    const result = signData({
      payload: Buffer.from(payload, "utf8"),
      privateKey: paymentPrivateKey,
      address,
    });
    testCip30Compliance({ result, address, payload, privateKey: paymentPrivateKey });
  });

  it("should sign data with base address", () => {
    const address = BaseAddress.new(1, paymentCred, stakeCred);
    const payload = "hello world";
    const result = signData({
      payload: Buffer.from(payload, "utf8"),
      privateKey: paymentPrivateKey,
      address,
    });
    testCip30Compliance({ result, address, payload, privateKey: paymentPrivateKey });
  });

  it("should sign data with reward address", () => {
    const address = RewardAddress.new(1, stakeCred);
    const payload = "hello world";
    const result = signData({
      payload: Buffer.from(payload, "utf8"),
      privateKey: stakePrivateKey,
      address,
    });
    testCip30Compliance({ result, address, payload, privateKey: stakePrivateKey });
  });

  it("should not sign data with script address", () => {
    const scriptHashHex = "01b50bc449e5f208523b84f95a2d9fe0d5f6313623a9ca18b7d151cb";
    const scriptCred = Credential.from_scripthash(ScriptHash.from_hex(scriptHashHex));
    const address = BaseAddress.new(1, scriptCred, stakeCred);
    const payload = "hello world";
    const result = signData({
      payload: Buffer.from(payload, "utf8"),
      privateKey: stakePrivateKey,
      address,
    });
    assert(isErr(result));
  });

  it("should not sign data with private key that doesn't match the address", () => {
    const address = BaseAddress.new(1, paymentCred, stakeCred);
    const payload = "hello world";
    const result = signData({
      payload: Buffer.from(payload, "utf8"),
      privateKey: stakePrivateKey,
      address,
    });
    assert(isErr(result));
  });
});

// @src https://cips.cardano.org/cip/CIP-0030
function testCip30Compliance(input: {
  result: Result<SignDataOutput>;
  address: ParsedAddress;
  payload: string;
  privateKey: PrivateKey;
}) {
  const { result, address, payload, privateKey } = input;
  assert(isOk(result));
  const { signature, key } = result;

  const coseSign1 = COSESign1.from_bytes(Buffer.from(signature, "hex"));

  const protectedHeaders = coseSign1.headers().protected().deserialized_headers();
  expect(protectedHeaders.algorithm_id()?.as_int()?.as_i32()).toBe(-8);
  const addressHeader = protectedHeaders.header(Label.new_text("address"));
  assert(addressHeader);
  expect(addressHeader.to_bytes().toString()).toBe(
    CBORValue.new_bytes(address.to_address().to_bytes()).to_bytes().toString(),
  );

  const sigStructReconstructed = coseSign1.signed_data(undefined, undefined).to_bytes();
  const sig = Ed25519Signature.from_bytes(coseSign1.signature());
  const isValid = privateKey.to_public().verify(sigStructReconstructed, sig);
  expect(isValid).toBe(true);

  const payloadToVerify = coseSign1.payload();
  assert(payloadToVerify);
  expect(Buffer.from(payloadToVerify).toString("utf8")).toBe(payload);

  const coseKey = COSEKey.from_bytes(Buffer.from(key, "hex"));
  expect(coseKey.key_type().as_int()?.as_i32()).toBe(1);
  expect(coseKey.algorithm_id()?.as_int()?.as_i32()).toBe(-8);
  expect(
    coseKey
      .header(Label.new_int(Int.new_i32(-1)))
      ?.as_int()
      ?.as_i32(),
  ).toBe(6);
  const xHeader = coseKey.header(Label.new_int(Int.new_i32(-2)))?.as_bytes();
  assert(xHeader);
  expect(Buffer.from(xHeader).toString("hex")).toBe(privateKey.to_public().to_hex());

  const keyId = protectedHeaders.key_id();
  if (keyId) {
    expect(Buffer.from(keyId).toString("hex")).toBe(address.to_address().to_hex());
    const coseKeyId = coseKey.key_id();
    assert(coseKeyId);
    expect(Buffer.from(coseKeyId).toString("hex")).toBe(address.to_address().to_hex());
  } else {
    expect(coseKey.key_id()).toBeUndefined();
  }
}
