import { parseFromHex } from "@anvil-vault/utils";
import { Ed25519Signature, PublicKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type VerifySignatureInput = {
  signature: Ed25519Signature | string;
  publicKey: PublicKey | string;
  data: Buffer | string;
};

export type VerifySignatureOutput = {
  isValid: boolean;
};

export function verifySignature(input: VerifySignatureInput): Result<VerifySignatureOutput> {
  try {
    const signature = unwrap(parseFromHex(input.signature, Ed25519Signature));
    const publicKey = unwrap(parseFromHex(input.publicKey, PublicKey));
    const data = unwrap(parseFromHex(input.data));

    const isValid = publicKey.verify(data, signature);

    return {
      isValid,
    };
  } catch (error) {
    return parseError(error);
  }
}
