# @anvil-vault/csl

Cardano Serialization Library (CSL) wrappers and utilities for Anvil Vault. This package provides type-safe, Result-based wrappers around the Emurgo Cardano Serialization Library.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Functions](#functions)
  - [Key Derivation](#key-derivation)
    - [deriveAccount](#deriveaccountinput)
    - [derivePrivateKey](#deriveprivatekeyinput)
    - [extractKeys](#extractkeysinput)
    - [harden](#hardennum)
  - [Address Generation](#address-generation)
    - [deriveAddresses](#deriveaddressesinput)
    - [parseAddress](#parseaddressinput)
  - [Transaction Operations](#transaction-operations)
    - [signTransaction](#signtransactioninput)
    - [addRequiredSigner](#addrequiredsignerinput)
  - [Data Signing & Verification](#data-signing--verification)
    - [signDataRaw](#signdatarawinput)
    - [verifySignature](#verifysignatureinput)
  - [Key Generation](#key-generation)
    - [generateEd25519KeyPair](#generateed25519keypair)
  - [Network Utilities](#network-utilities)
    - [getNetworkId](#getnetworkidnetwork)
    - [networks](#networks)
- [Type Definitions](#type-definitions)
- [CIP Standards](#cip-standards)
- [Dependencies](#dependencies)

## Installation

```bash
npm install @anvil-vault/csl
```

## Overview

The CSL package provides:

- **Key Derivation**: BIP32 hierarchical deterministic key derivation
- **Address Generation**: Create base, enterprise, and reward addresses
- **Transaction Signing**: Sign transactions with private keys
- **Data Signing**: Sign arbitrary data with Ed25519 keys
- **Signature Verification**: Verify Ed25519 signatures
- **Address Parsing**: Parse addresses from various formats
- **Network Utilities**: Network ID and configuration helpers

All functions return `Result` types from the `trynot` library for consistent error handling.

## Functions

### Key Derivation

#### `deriveAccount(input)`

Derives an account key from a root key following CIP-1852.

**Parameters:**

- `input.rootKey: Bip32PrivateKey | string` - Root private key
- `input.accountDerivation: number | number[]` - Account index or derivation path

**Returns:** `Result<DeriveAccountOutput>`

- `rootKey: Bip32PrivateKey` - The parsed root key
- `accountKey: Bip32PrivateKey` - The derived account key

**Example:**

```typescript
import { deriveAccount } from "@anvil-vault/csl";
import { isOk } from "trynot";

// Derive account 0
const result = deriveAccount({
  rootKey: process.env.ROOT_KEY,
  accountDerivation: 0,
});

if (isOk(result)) {
  console.log("Account key derived:", result.accountKey.to_hex());
}
```

#### `derivePrivateKey(input)`

Derives a BIP32 private key from BIP39 entropy (mnemonic seed).

**Parameters:**

- `input.entropy: Buffer | string` - BIP39 entropy
- `input.password?: Buffer | string` - Optional password for entropy

**Returns:** `Result<Bip32PrivateKey>`

**Example:**

```typescript
import { derivePrivateKey } from "@anvil-vault/csl";
import { isOk } from "trynot";

const entropy = process.env.ENTROPY;
const result = derivePrivateKey({ entropy });

if (isOk(result)) {
  console.log("Root key:", result.to_hex());
}
```

#### `extractKeys(input)`

Extracts payment and stake keys from an account key following CIP-1852.

**Parameters:**

- `input.accountKey: Bip32PrivateKey | string` - Account key
- `input.paymentDerivation: number | number[]` - Payment key derivation path
- `input.stakeDerivation: number | number[]` - Stake key derivation path

**Returns:** `Result<ExtractKeysOutput>`

- `accountKey: Bip32PrivateKey` - The parsed account key
- `paymentKey: Bip32PrivateKey` - Derived payment key (external chain)
- `stakeKey: Bip32PrivateKey` - Derived stake key (staking chain)

**Example:**

```typescript
import { extractKeys } from "@anvil-vault/csl";
import { isOk } from "trynot";

const result = extractKeys({
  accountKey, // Hex format account key
  paymentDerivation: 0, // First payment key
  stakeDerivation: 0, // First stake key
});

if (isOk(result)) {
  console.log("Payment key:", result.paymentKey.to_public().to_hex());
  console.log("Stake key:", result.stakeKey.to_public().to_hex());
}
```

#### `harden(num)`

Converts a derivation index to its hardened equivalent by adding 2^31.

**Parameters:**

- `num: number` - Derivation index

**Returns:** `number` - Hardened index (num + 0x80000000)

**Example:**

```typescript
import { harden } from "@anvil-vault/csl";

console.log(harden(0)); // 2147483648 (0x80000000)
console.log(harden(1852)); // 2147485500 (0x8000073C)
```

### Address Generation

#### `deriveAddresses(input)`

Derives Cardano addresses from payment and stake keys.

**Parameters:**

- `input.paymentKey: Bip32PrivateKey | string` - Payment private key
- `input.stakeKey: Bip32PrivateKey | string` - Stake private key
- `input.network: Network | NetworkId` - Network ("mainnet", "preprod", "preview", or 0/1)

**Returns:** `Result<DeriveAddressesOutput>`

- `paymentKey: Bip32PrivateKey` - Parsed payment key
- `stakeKey: Bip32PrivateKey` - Parsed stake key
- `baseAddress: BaseAddress` - Base address (payment + stake)
- `enterpriseAddress: EnterpriseAddress` - Enterprise address (payment only)
- `rewardAddress: RewardAddress` - Reward address (stake only)

**Example:**

```typescript
import { deriveAddresses } from "@anvil-vault/csl";
import { isOk } from "trynot";

const result = deriveAddresses({
  paymentKey: paymentKeyHex,
  stakeKey: stakeKeyHex,
  network: "preprod",
});

if (isOk(result)) {
  console.log("Base:", result.baseAddress.to_address().to_bech32());
  console.log("Enterprise:", result.enterpriseAddress.to_address().to_bech32());
  console.log("Reward:", result.rewardAddress.to_address().to_bech32());
}
```

#### `parseAddress(input)`

Parses a Cardano address from various formats (bech32, hex, or CSL object).

**Parameters:**

- `input.address: Address | string | ParsedAddress` - Address to parse

**Returns:** `Result<ParsedAddress>`

- Returns one of: `BaseAddress`, `EnterpriseAddress`, `PointerAddress`, or `RewardAddress`

**Example:**

```typescript
import { parseAddress } from "@anvil-vault/csl";
import { BaseAddress } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { isOk } from "trynot";

const result = parseAddress({
  address: "addr_test1qz...",
});

if (isOk(result) && result instanceof BaseAddress) {
  console.log(
    "Payment credential:",
    result.payment_cred().to_keyhash()?.to_hex()
  );
  console.log("Stake credential:", result.stake_cred().to_keyhash()?.to_hex());
}
```

### Transaction Operations

#### `signTransaction(input)`

Signs a Cardano transaction with one or more private keys.

**Parameters:**

- `input.transaction: Transaction | FixedTransaction | string` - Transaction to sign (hex-encoded CBOR when string)
- `input.privateKeys: Array<PrivateKey | string>` - Private keys for signing

**Returns:** `Result<SignTransactionOutput>`

- `signedTransaction: FixedTransaction` - Signed transaction
- `witnessSet: TransactionWitnessSet` - Witness set with signatures

**Example:**

```typescript
import { signTransaction } from "@anvil-vault/csl";
import { isOk } from "trynot";

const result = signTransaction({
  transaction: transactionHex,
  privateKeys: [paymentPrivateKeyHex, stakePrivateKeyHex],
});

if (isOk(result)) {
  console.log("Signed TX:", result.signedTransaction.to_hex());
  console.log("Witness set:", result.witnessSet.to_hex());
}
```

#### `addRequiredSigner(input)`

Adds a required signer key hash to a transaction.

**Parameters:**

- `input.transaction: Transaction | FixedTransaction | string` - Transaction to edit
- `input.keyHash: Ed25519KeyHash | string` - Key hash to add as required signer

**Returns:** `Result<Transaction | FixedTransaction>`

- Returns the same type as input transaction

**Example:**

```typescript
import { addRequiredSigner } from "@anvil-vault/csl";
import { isOk } from "trynot";

const result = addRequiredSigner({
  transaction: transactionHex,
  keyHash: keyHashHex,
});

if (isOk(result)) {
  console.log("Updated transaction:", result.to_hex());
}
```

### Data Signing & Verification

#### `signDataRaw(input)`

Signs arbitrary data with an Ed25519 private key.

**Parameters:**

- `input.data: Buffer | string` - Data to sign (hex string; for UTF-8 text use `Buffer.from(text, "utf8")`)
- `input.privateKey: PrivateKey | string` - Private key for signing

**Returns:** `Result<SignDataRawOutput>`

- `signature: Ed25519Signature` - The signature

**Example:**

```typescript
import { signDataRaw } from "@anvil-vault/csl";
import { isOk } from "trynot";

const message = Buffer.from("Hello, Cardano!", "utf8");

const result = signDataRaw({
  data: message,
  privateKey: privateKeyHex,
});

if (isOk(result)) {
  console.log("Signature:", result.signature.to_hex());
}
```

#### `verifySignature(input)`

Verifies an Ed25519 signature against data and public key.

**Parameters:**

- `input.signature: Ed25519Signature | string` - Signature to verify
- `input.publicKey: PublicKey | string` - Public key
- `input.data: Buffer | string` - Original data that was signed

**Returns:** `Result<VerifySignatureOutput>`

- `isValid: boolean` - Whether the signature is valid

**Example:**

```typescript
import { verifySignature } from "@anvil-vault/csl";
import { isOk } from "trynot";

const result = verifySignature({
  signature: signatureHex,
  publicKey: publicKeyHex,
  data: Buffer.from("Hello, Cardano!", "utf8"),
});

if (isOk(result)) {
  console.log("Signature is valid:", result.isValid);
}
```

### Key Generation

#### `generateEd25519KeyPair()`

Generates a new random Ed25519 key pair.

**Returns:** `Result<GenerateKeyPairOutput>`

- `privateKey: PrivateKey` - Generated private key
- `publicKey: PublicKey` - Corresponding public key

**Example:**

```typescript
import { generateEd25519KeyPair } from "@anvil-vault/csl";
import { isOk } from "trynot";

const result = generateEd25519KeyPair();

if (isOk(result)) {
  console.log("Private key:", result.privateKey.to_hex());
  console.log("Public key:", result.publicKey.to_hex());
}
```

### Network Utilities

#### `getNetworkId(network)`

Converts network name to network ID.

**Parameters:**

- `network: Network | NetworkId` - Network name or ID

**Returns:** `NetworkId` (0 for testnet, 1 for mainnet)

**Example:**

```typescript
import { getNetworkId } from "@anvil-vault/csl";

getNetworkId("mainnet"); // 1
getNetworkId("preprod"); // 0
getNetworkId("preview"); // 0
getNetworkId(0); // 0 (pass-through)
getNetworkId(1); // 1 (pass-through)
```

#### `networks`

Array of supported network names.

**Type:** `readonly ["mainnet", "preprod", "preview"]`

## Type Definitions

### Network Types

```typescript
type Network = "mainnet" | "preprod" | "preview";
type NetworkId = number; // 0 for testnet, 1 for mainnet
```

### Transaction Types

**CSL types: `Transaction | FixedTransaction`**

```typescript
type TransactionInput = Transaction | FixedTransaction | string;
```

### Address Types

**CSL types: `BaseAddress | EnterpriseAddress | PointerAddress | RewardAddress`**

```typescript
type ParsedAddress =
  | BaseAddress
  | EnterpriseAddress
  | PointerAddress
  | RewardAddress;
```

## CIP Standards

This package follows Cardano Improvement Proposals:

- **CIP-1852**: HD Wallets for Cardano
  - Derivation path: `m/1852'/1815'/account'/chain/index`
  - Purpose: 1852' (hardened)
  - Coin type: 1815' (Cardano, hardened)
  - Account: 0' to 2^31-1 (hardened)
  - Chain: 0 (external/payment), 1 (internal/change), 2 (staking)
  - Index: 0 to 2^31-1 (non-hardened)

## Dependencies

- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Core Cardano serialization library
- **`@anvil-vault/utils`**: Shared utilities (parseFromHex, error handling)
- **`trynot`**: Result type for error handling

## Related Packages

- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/cms](../cms/README.md)**: Message signing utilities
- **[@anvil-vault/utils](../utils/README.md)**: Shared utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord Invite</a>
  |
  <a href="https://x.com/AnvilDevAgency">X: @AnvilDevAgency</a>
</p>
