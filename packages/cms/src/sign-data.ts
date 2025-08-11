import { parseFromHex } from "@anvil-vault/utils";
import {
  AlgorithmId,
  CBORValue,
  COSEKey,
  COSESign1Builder,
  HeaderMap,
  Headers,
  Int,
  KeyType,
  Label,
  ProtectedHeaderMap,
} from "@emurgo/cardano-message-signing-nodejs-gc";
import type { Address, PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type SignDataInput = {
  payload: string | Buffer;
  address: Address;
  privateKey: PrivateKey;
  externalAad?: string | Buffer;
};

export type SignDataOutput = {
  signature: string;
  key: string;
};

/**
 * Signs a data with the given private key.
 */
export function signData(input: SignDataInput): Result<SignDataOutput> {
  try {
    const privateKey = input.privateKey;
    const payload = unwrap(parseFromHex(input.payload));
    const externalAad = unwrap(parseFromHex(input.externalAad));

    const protectedHeaders = HeaderMap.new();
    const protectedSerialized = ProtectedHeaderMap.new(protectedHeaders);
    const unprotected = HeaderMap.new();
    const headers = Headers.new(protectedSerialized, unprotected);
    const builder = COSESign1Builder.new(headers, payload, false);

    if (externalAad) {
      builder.set_external_aad(externalAad);
    }

    const toSign = builder.make_data_to_sign().to_bytes();

    const signedSigStructure = privateKey.sign(toSign).to_bytes();
    const coseSign1 = builder.build(signedSigStructure);

    const coseKey = COSEKey.new(Label.from_key_type(KeyType.OKP));
    coseKey.set_algorithm_id(Label.from_algorithm_id(AlgorithmId.EdDSA));
    coseKey.set_header(Label.new_int(Int.new_i32(-1)), CBORValue.new_int(Int.new_i32(6)));
    coseKey.set_header(
      Label.new_int(Int.new_i32(-2)),
      CBORValue.new_bytes(privateKey.to_public().as_bytes()),
    );

    return {
      signature: Buffer.from(coseSign1.to_bytes()).toString("hex"),
      key: Buffer.from(coseKey.to_bytes()).toString("hex"),
    };
  } catch (error) {
    return parseError(error);
  }
}
