import { PrivateKey, type PublicKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { parseError, type Result } from "trynot";

export type GenerateKeyPairOutput = {
  privateKey: PrivateKey;
  publicKey: PublicKey;
};

export function generateEd25519KeyPair(): Result<GenerateKeyPairOutput> {
  try {
    const privateKey = PrivateKey.generate_ed25519();
    const publicKey = privateKey.to_public();

    return {
      privateKey,
      publicKey,
    };
  } catch (error) {
    return parseError(error);
  }
}
