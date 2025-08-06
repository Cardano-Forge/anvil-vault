import { signTx } from "@cardano-forge/csl";
import { PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export function signTransaction(txHex: string, privateKeyHex: string): Result<string> {
  try {
    const privateKey = PrivateKey.from_hex(privateKeyHex);
    const signedTx = unwrap(signTx(txHex, privateKey));
    return signedTx.to_hex();
  } catch (error) {
    return parseError(error);
  }
}
