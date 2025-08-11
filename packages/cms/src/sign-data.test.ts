import { expect, test } from "vitest";
import { signData } from "./sign-data";
import { Ed25519Signature, PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isOk } from "trynot";
import { COSEKey, COSESign1, Int, KeyType, Label } from "@emurgo/cardano-message-signing-nodejs-gc";

test("signData", () => {
  const privateKeyHex =
    "20989a3592541cbd31337e1c749ba9a87da156ea157a8039bab88ce7611c24411ef9312e6858d51c9f3253d00a98cc416e70bbe52089e663c5a02ef41229d383";
  const privateKey = PrivateKey.from_hex(privateKeyHex);
  const payload = "hello world";
  const res = signData({ payload: Buffer.from(payload, "utf8"), privateKey });
  assert(isOk(res));

  const { signature, key } = res;

  const coseSign1 = COSESign1.from_bytes(Buffer.from(signature, "hex"));
  const sigStructReconstructed = coseSign1.signed_data(undefined, undefined).to_bytes();
  const sig = Ed25519Signature.from_bytes(coseSign1.signature());
  const isValid = privateKey.to_public().verify(sigStructReconstructed, sig);
  expect(isValid).toBe(true);

  const payloadToVerify = coseSign1.payload();
  assert(payloadToVerify);
  expect(Buffer.from(payloadToVerify).toString("utf8")).toBe(payload);

  // Following cip 30 https://cips.cardano.org/cip/CIP-0030
  const coseKey = COSEKey.from_bytes(Buffer.from(key, "hex"));
  expect(coseKey.key_type().as_int()?.as_i32()).toBe(1);
  expect(coseKey.key_id()?.toString()).toBeUndefined();
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
});
