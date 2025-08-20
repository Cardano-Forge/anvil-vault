import type { ExtractKeysOutput, Network, NetworkId } from "@anvil-vault/csl";
import type { MaybePromise } from "@anvil-vault/utils";
import type { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import type { Result } from "trynot";

export type GetWalletInput = {
  userId: string;
};

export type GetWalletOutput = {
  addresses: {
    base: { bech32: string; hex: string };
    enterprise: { bech32: string; hex: string };
    reward: { bech32: string; hex: string };
  };
};

export type SignDataInput = {
  userId: string;
  payload: string;
  externalAad?: string;
};

export type SignDataOutput = {
  signature: string;
  key: string;
};

export type SignTransactionInput = {
  userId: string;
  transaction: string;
};

export type SignTransactionOutput = {
  signedTransaction: string;
};

export type RequiredVaultConfig = {
  rootKey: () => MaybePromise<Bip32PrivateKey | string>;
  network: Network | NetworkId;
};

export type DeriveWalletOutput = ExtractKeysOutput & {
  rootKey?: Bip32PrivateKey;
};

export type Derivation<TContext = undefined> =
  | {
      type: "unique";
      scrambler?: (
        derivationPath: number[],
        input: { userId: string },
        context: TContext,
      ) => MaybePromise<Result<number[]>>;
    }
  | {
      type: "pool";
      size: number;
    }
  | {
      type: "constant";
      value: number | number[];
    }
  | {
      type: "custom";
      provider: (
        input: { userId: string },
        context: TContext,
      ) => MaybePromise<Result<number | number[] | Derivation<TContext>>>;
    };

export type VaultConfig = RequiredVaultConfig & {
  accountDerivation?: Derivation<RequiredVaultConfig>;
  paymentDerivation?: Derivation<RequiredVaultConfig>;
  stakeDerivation?: Derivation<RequiredVaultConfig>;
  customWalletDerivation?: (
    input: { userId: string },
    config: RequiredVaultConfig,
  ) => MaybePromise<Result<DeriveWalletOutput>>;
  additionalWalletDerivation?: (
    keys: DeriveWalletOutput,
    input: { userId: string },
    config: RequiredVaultConfig,
  ) => MaybePromise<Result<DeriveWalletOutput>>;
  ignoreDefaultPaymentDerivationWarning?: boolean;
};
