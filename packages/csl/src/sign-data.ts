import { parseFromHex } from "@anvil-vault/utils";
import { type Ed25519Signature, PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type SignDataInput = {
  data: Buffer | string;
  privateKey: PrivateKey | string;
};

export type SignDataOutput = {
  signature: Ed25519Signature;
};

export function signData(input: SignDataInput): Result<SignDataOutput> {
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
