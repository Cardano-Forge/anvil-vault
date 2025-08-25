import { signDataWallet } from "@anvil-vault/cms";
import { type ExtractKeysOutput, deriveAddresses, signTransaction } from "@anvil-vault/csl";
import type {
  Derivation,
  DeriveWalletOutput,
  IVault,
  RequiredVaultConfig,
  VaultConfig,
} from "@anvil-vault/handler";
import { VaultError } from "@anvil-vault/utils";
import { parseFromHex } from "@anvil-vault/utils";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";
import { deriveWallet } from "./derive-wallet";

export const DEFAULT_VAULT_DERIVATIONS = {
  account: {
    type: "constant",
    value: 0,
  },
  payment: {
    type: "unique",
    scrambler: (i) => i.reverse(),
  },
  stake: {
    type: "pool",
    size: 10,
  },
} satisfies Record<string, Derivation>;

export class Vault implements IVault {
  constructor(public config: VaultConfig) {}

  set<T extends keyof VaultConfig>(key: T, value: VaultConfig[T]): this {
    this.config[key] = value;
    return this;
  }

  with<T extends keyof VaultConfig>(key: T, value: VaultConfig[T]): Vault {
    return new Vault({
      ...this.config,
      [key]: value,
    });
  }

  getWallet: IVault["getWallet"] = async (input) => {
    try {
      return await unwrap(
        this._withDerivedWallet(input, async (wallet) => {
          const addresses = unwrap(
            deriveAddresses({
              paymentKey: wallet.paymentKey,
              stakeKey: wallet.stakeKey,
              network: this.config.network,
            }),
          );

          return {
            addresses: {
              base: {
                bech32: addresses.baseAddress.to_address().to_bech32(),
                hex: addresses.baseAddress.to_address().to_hex(),
              },
              enterprise: {
                bech32: addresses.enterpriseAddress.to_address().to_bech32(),
                hex: addresses.enterpriseAddress.to_address().to_hex(),
              },
              reward: {
                bech32: addresses.rewardAddress.to_address().to_bech32(),
                hex: addresses.rewardAddress.to_address().to_hex(),
              },
            },
          };
        }),
      );
    } catch (error) {
      return new VaultError({
        message: "Failed to get wallet",
        statusCode: 500,
        cause: parseError(error),
      });
    }
  };

  signData: IVault["signData"] = async (input) => {
    try {
      return await unwrap(
        this._withDerivedWallet(input, async (wallet) => {
          const addresses = unwrap(
            deriveAddresses({
              paymentKey: wallet.paymentKey,
              stakeKey: wallet.stakeKey,
              network: this.config.network,
            }),
          );

          return signDataWallet({
            payload: input.payload,
            address: addresses.baseAddress,
            privateKey: wallet.paymentKey.to_raw_key(),
            externalAad: input.externalAad,
          });
        }),
      );
    } catch (error) {
      return new VaultError({
        message: "Failed to sign data",
        statusCode: 500,
        cause: parseError(error),
      });
    }
  };

  signTransaction: IVault["signTransaction"] = async (input) => {
    try {
      return await unwrap(
        this._withDerivedWallet(input, async (wallet) => {
          const signedTransaction = unwrap(
            signTransaction({
              transaction: input.transaction,
              privateKeys: [wallet.paymentKey.to_raw_key()],
            }),
          );
          return {
            signedTransaction: signedTransaction.to_hex(),
          };
        }),
      );
    } catch (error) {
      return new VaultError({
        message: "Failed to sign transaction",
        statusCode: 500,
        cause: parseError(error),
      });
    }
  };

  protected async _withDerivedWallet<T>(
    input: { userId: string },
    callback: (wallet: ExtractKeysOutput) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    const pointers = new Set<{ free: () => void }>();
    try {
      const wallet = unwrap(await this._deriveWallet({ userId: input.userId }));
      for (const privateKey of Object.values(wallet)) {
        pointers.add(privateKey);
      }
      return await callback(wallet);
    } catch (error) {
      return parseError(error);
    } finally {
      for (const pointer of pointers) {
        try {
          pointer.free();
        } catch {}
      }
    }
  }

  private async _deriveWallet(input: { userId: string }): Promise<Result<DeriveWalletOutput>> {
    try {
      const requiredConfig = this._getRequiredConfig();

      if (this.config.customWalletDerivation) {
        return unwrap(
          await this.config.customWalletDerivation(
            {
              userId: input.userId,
            },
            requiredConfig,
          ),
        );
      }

      const providedRootKey = await this.config.rootKey();
      const rootKey = unwrap(parseFromHex(providedRootKey, Bip32PrivateKey));

      if (!this.config.paymentDerivation && !this.config.ignoreDefaultPaymentDerivationWarning) {
        console.warn(
          "ANVIL VAULT WARNING: Using unsafe default payment derivation. \nPlease provide a custom payment derivation strategy in your vault config.",
        );
      }

      const keys = await unwrap(
        deriveWallet(
          {
            userId: input.userId,
            rootKey,
            accountDerivation: this.config.accountDerivation ?? DEFAULT_VAULT_DERIVATIONS.account,
            paymentDerivation: this.config.paymentDerivation ?? DEFAULT_VAULT_DERIVATIONS.payment,
            stakeDerivation: this.config.stakeDerivation ?? DEFAULT_VAULT_DERIVATIONS.stake,
          },
          requiredConfig,
        ),
      );

      if (!this.config.additionalWalletDerivation) {
        return keys;
      }

      const finalKeys = unwrap(
        await this.config.additionalWalletDerivation(
          keys,
          {
            userId: input.userId,
          },
          requiredConfig,
        ),
      );

      return finalKeys;
    } catch (error) {
      return parseError(error);
    }
  }

  protected _getRequiredConfig(): RequiredVaultConfig {
    return {
      rootKey: this.config.rootKey,
      network: this.config.network,
    };
  }
}
