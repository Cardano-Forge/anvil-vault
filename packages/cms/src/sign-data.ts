import type { ParsedAddress } from "@anvil-vault/csl";
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
import type { PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type SignDataInput = {
  payload: string | Buffer;
  address: ParsedAddress;
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
    const addressBytes = input.address.to_address().to_bytes();

    const paymentCred = input.address.payment_cred();
    if (paymentCred.has_script_hash()) {
      return new Error("Can't sign data with script address");
    }

    const paymentHash = paymentCred.to_keyhash();
    if (!paymentHash) {
      return new Error("Can't get payment hash from address");
    }

    if (paymentHash.to_hex() !== privateKey.to_public().hash().to_hex()) {
      return new Error("Private key doesn't match the address");
    }

    const protectedHeaders = HeaderMap.new();

    protectedHeaders.set_algorithm_id(Label.from_algorithm_id(AlgorithmId.EdDSA));
    protectedHeaders.set_key_id(addressBytes);
    protectedHeaders.set_header(Label.new_text("address"), CBORValue.new_bytes(addressBytes));

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
    coseKey.set_key_id(addressBytes);
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
