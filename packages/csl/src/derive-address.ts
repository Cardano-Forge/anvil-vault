import { parseFromHex } from "@anvil-vault/utils";
import {
  BaseAddress,
  Bip32PrivateKey,
  Credential,
  EnterpriseAddress,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { type Network, type NetworkId, getNetworkId } from "./network";

export type DeriveAddressInput = {
  accountKey: Bip32PrivateKey | string;
  addressIndex: number;
  network: Network | NetworkId;
};

export type DeriveAddressOutput = {
  accountKey: Bip32PrivateKey;
  paymentKey: Bip32PrivateKey;
  stakeKey: Bip32PrivateKey;
  baseAddress: BaseAddress;
  enterpriseAddress: EnterpriseAddress;
  rewardAddress: RewardAddress;
};

export function deriveAddress(input: DeriveAddressInput): Result<DeriveAddressOutput> {
  try {
    const accountKey = unwrap(parseFromHex(input.accountKey, Bip32PrivateKey));
    const addressIndex = input.addressIndex;

    const paymentKey = accountKey
      .derive(0) // External chain
      .derive(addressIndex); // Different payment key for each address index

    const stakeKey = accountKey
      .derive(2) // Staking chain
      .derive(0); // Same stake key for all address indices

    const paymentPublicKey = paymentKey.to_public();
    const stakePublicKey = stakeKey.to_public();

    const paymentCredential = Credential.from_keyhash(paymentPublicKey.to_raw_key().hash());
    const stakeCredential = Credential.from_keyhash(stakePublicKey.to_raw_key().hash());

    const networkId = getNetworkId(input.network);

    const baseAddress = BaseAddress.new(networkId, paymentCredential, stakeCredential);
    const enterpriseAddress = EnterpriseAddress.new(networkId, paymentCredential);
    const rewardAddress = RewardAddress.new(networkId, stakeCredential);

    return {
      accountKey,
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
