export { VaultError } from "./errors";
export { createVaultHandler, handleVaultRequest } from "./handler-builder";
export type { AnyParams, HandlerAdapter } from "./handler-types";
export { createHandlerAdapter } from "./handler-types";
export { getDerivation, type GetDerivationInput } from "./get-derivation";
export type {
  RequiredVaultConfig,
  DeriveWalletOutput,
  Derivation,
  VaultConfig,
  IVault,
} from "./types";
