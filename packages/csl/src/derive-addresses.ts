import { parseFromHex } from "@anvil-vault/utils";
import {
  BaseAddress,
  Bip32PrivateKey,
  Credential,
  EnterpriseAddress,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { parseError, type Result, unwrap } from "trynot";
import { getNetworkId, type Network, type NetworkId } from "./network";

export type DeriveAddressesInput = {
  paymentKey: Bip32PrivateKey | string;
  stakeKey: Bip32PrivateKey | string;
  network: Network | NetworkId;
};

export type DeriveAddressesOutput = {
  paymentKey: Bip32PrivateKey;
  stakeKey: Bip32PrivateKey;
  baseAddress: BaseAddress;
  enterpriseAddress: EnterpriseAddress;
  rewardAddress: RewardAddress;
};

export function deriveAddresses(input: DeriveAddressesInput): Result<DeriveAddressesOutput> {
  try {
    const paymentKey = unwrap(parseFromHex(input.paymentKey, Bip32PrivateKey));
    const stakeKey = unwrap(parseFromHex(input.stakeKey, Bip32PrivateKey));

    const paymentPublicKey = paymentKey.to_public();
    const stakePublicKey = stakeKey.to_public();

    const paymentCredential = Credential.from_keyhash(paymentPublicKey.to_raw_key().hash());
    const stakeCredential = Credential.from_keyhash(stakePublicKey.to_raw_key().hash());

    const networkId = getNetworkId(input.network);

    const baseAddress = BaseAddress.new(networkId, paymentCredential, stakeCredential);
    const enterpriseAddress = EnterpriseAddress.new(networkId, paymentCredential);
    const rewardAddress = RewardAddress.new(networkId, stakeCredential);

    return {
      paymentKey,
      stakeKey,
      baseAddress,
      enterpriseAddress,
      rewardAddress,
    };
  } catch (error) {
    return parseError(error);
  }
}
