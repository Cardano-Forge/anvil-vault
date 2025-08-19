export { deriveWallet, type DeriveWalletInput } from "./derive-wallet";
export { VaultError } from "./errors";
export { getDerivation, type GetDerivationInput } from "./get-derivation";
export { createVaultHandler, handleVaultRequest } from "./handler-builder";
export type { AnyParams, HandlerAdapter } from "./handler-types";
export { createHandlerAdapter } from "./handler-types";
export type {
  GetWalletInput,
  GetWalletOutput,
  SignDataInput,
  SignDataOutput,
  SignTransactionInput,
  SignTransactionOutput,
  RequiredVaultConfig,
  DeriveWalletOutput,
  Derivation,
  VaultConfig,
} from "./types";
export { Vault, DEFAULT_VAULT_DERIVATIONS } from "./vault";
