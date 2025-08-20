import { type ExtractKeysOutput, deriveAccount, extractKeys } from "@anvil-vault/csl";
import { type Derivation, getDerivation } from "@anvil-vault/handler";
import type { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { type Result, parseError, unwrap } from "trynot";

export type DeriveWalletInput<TContext = undefined> = {
  userId: string;
  rootKey: Bip32PrivateKey | string;
  accountDerivation: Derivation<TContext>;
  paymentDerivation: Derivation<TContext>;
  stakeDerivation: Derivation<TContext>;
};

export async function deriveWallet(input: DeriveWalletInput): Promise<Result<ExtractKeysOutput>>;
export async function deriveWallet<TContext>(
  input: DeriveWalletInput<TContext>,
  context: TContext,
): Promise<Result<ExtractKeysOutput>>;
export async function deriveWallet<TContext>(
  input: DeriveWalletInput<TContext>,
  context?: TContext,
): Promise<Result<ExtractKeysOutput>> {
  try {
    const accountDerivation = await unwrap(
      getDerivation(
        {
          userId: input.userId,
          derivation: input.accountDerivation,
        },
        context as TContext,
      ),
    );

    const account = unwrap(
      deriveAccount({
        rootKey: input.rootKey,
        accountDerivation,
      }),
    );

    const paymentDerivation = await unwrap(
      getDerivation(
        {
          userId: input.userId,
          derivation: input.paymentDerivation,
        },
        context as TContext,
      ),
    );

    const stakeDerivation = await unwrap(
      getDerivation(
        {
          userId: input.userId,
          derivation: input.stakeDerivation,
        },
        context as TContext,
      ),
    );

    return unwrap(
      extractKeys({
        accountKey: account.accountKey,
        paymentDerivation,
        stakeDerivation,
      }),
    );
  } catch (error) {
    return parseError(error);
  }
}
