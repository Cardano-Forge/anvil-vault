import { parseFromHex } from "@anvil-vault/utils";
import { type Ed25519Signature, PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { parseError, type Result, unwrap } from "trynot";

export type SignDataRawInput = {
  data: Buffer | string;
  privateKey: PrivateKey | string;
};

export type SignDataRawOutput = {
  signature: Ed25519Signature;
};

export function signDataRaw(input: SignDataRawInput): Result<SignDataRawOutput> {
  try {
    const privateKey = unwrap(parseFromHex(input.privateKey, PrivateKey));
    const data = unwrap(parseFromHex(input.data));

    const signature = privateKey.sign(data);

    return {
      signature,
    };
  } catch (error) {
    return parseError(error);
  }
}
