# @anvil-vault/vault

Core vault implementation for Anvil Vault. This package provides the `Vault` class that manages hierarchical deterministic wallet derivation, address generation, data signing, and transaction signing for Cardano.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Concepts](#concepts)
  - [What is a Vault?](#what-is-a-vault)
  - [When to Use](#when-to-use)
  - [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Vault Class](#vault-class)
  - [deriveWallet Function](#derivewallet-function)
- [Derivation Strategies](#derivation-strategies)
- [Security Considerations](#security-considerations)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/vault
```

## Overview

All methods return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

## Concepts

### What is a Vault?

The Vault is a high-level orchestration layer that:

- **Manages multi-user wallets**: Derives unique addresses for each user from a single root key
- **Provides flexible derivation**: Multiple strategies (unique, pool, constant, custom) for different use cases
- **Simplifies operations**: High-level API for common wallet operations (get addresses, sign data, sign transactions)

### When to Use

**Use Vault when:**

- Building custodial wallet services
- Managing wallets for multiple users
- Creating REST APIs for wallet operations
- Need automatic key management

**Use CSL directly when:**

- Single wallet application
- Need full control over derivation logic
- Building non-custodial wallets
- Custom cryptographic operations

### Architecture

The Vault fits into the Anvil ecosystem:

```txt
Vault (this package)
  ↓ uses
CSL (@anvil-vault/csl) - Low-level wrappers
  ↓ uses
CMS (@anvil-vault/cms) - Message signing
  ↓ exposes via
Handler (@anvil-vault/handler) - REST API
  ↓ adapts to
Express/Hono - Web frameworks
```

## Quick Start

```typescript
import { Vault } from "@anvil-vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: 0, // 0 = testnet, 1 = mainnet
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});

// Get wallet addresses
const userId = "user123";
const walletResult = await vault.getWallet({ userId });

if (isOk(walletResult)) {
  console.log("Base address:", walletResult.addresses.base.bech32);
}

// Sign data
const signResult = await vault.signData({
  userId,
  payload: "hello world",
});

if (isOk(signResult)) {
  console.log("Signature:", signResult.signature);
}

// Sign transaction
const txHex = "<valid-transaction-hex>";

const signedResult = await vault.signTransaction({
  userId,
  transaction: txHex,
});

if (isOk(signedResult)) {
  console.log("Signed transaction:", signedResult.signedTransaction);
  console.log("Witness set:", signedResult.witnessSet);
}
```

## API Reference

### `Vault` Class

#### Constructor

```typescript
const vault = new Vault(config: VaultConfig);
```

**Configuration Options:**

- `rootKey: () => MaybePromise<string>` - Function returning the root private key (hex)
- `network: Network | NetworkId` - Network ("mainnet", "preprod", "preview", or 0/1)
- `accountDerivation?: Derivation` - Account derivation strategy (default: constant 0)
- `paymentDerivation?: Derivation` - Payment key derivation strategy (default: unique reversed)
- `stakeDerivation?: Derivation` - Stake key derivation strategy (default: pool of 10)
- `customWalletDerivation?: CustomDerivation` - Override default wallet derivation
- `additionalWalletDerivation?: AdditionalDerivation` - Modify derived keys
- `ignoreDefaultPaymentDerivationWarning?: boolean` - Suppress warning for default payment derivation

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: async () => {
    // Fetch from secure storage
    return await getSecureRootKey();
  },
  network: "preprod",
  accountDerivation: {
    type: "constant",
    value: 0,
  },
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
  stakeDerivation: {
    type: "pool",
    size: 100,
  },
});
```

#### `vault.getWallet(input)`

Retrieves wallet addresses for a user.

**Parameters:**

- `input.userId: string` - User identifier

**Returns:** `Promise<Result<GetWalletOutput>>`

```typescript
type GetWalletOutput = {
  addresses: {
    base: { bech32: string; hex: string };
    enterprise: { bech32: string; hex: string };
    reward: { bech32: string; hex: string };
  };
};
```

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const result = await vault.getWallet({ userId: "user123" });

if (isOk(result)) {
  console.log("Base address:", result.addresses.base.bech32);
  console.log("Enterprise address:", result.addresses.enterprise.bech32);
  console.log("Reward address:", result.addresses.reward.bech32);

  // Addresses are available in both formats
  console.log("Base hex:", result.addresses.base.hex);
}
```

#### `vault.signData(input)`

Signs arbitrary data using CIP-8/CIP-30 standards.

**Parameters:**

- `input.userId: string` - User identifier
- `input.payload: string | Buffer` - Data to sign
- `input.externalAad?: string | Buffer` - Optional external Additional Authenticated Data

**Returns:** `Promise<Result<SignDataOutput>>`

```typescript
type SignDataOutput = {
  signature: string; // COSE Sign1 hex
  key: string; // COSE Key hex
};
```

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const result = await vault.signData({
  userId: "user123",
  payload: Buffer.from("Verify my identity", "utf8"),
});

if (isOk(result)) {
  console.log("Signature:", result.signature);
  console.log("Public key:", result.key);
}

// With external AAD
const resultWithAad = await vault.signData({
  userId: "user123",
  payload: "Transaction data",
  externalAad: "Additional context",
});
```

#### `vault.signTransaction(input)`

Signs a Cardano transaction with the user's payment key.

**Parameters:**

- `input.userId: string` - User identifier
- `input.transaction: string | Transaction | FixedTransaction` - Transaction to sign

**Returns:** `Promise<Result<SignTransactionOutput>>`

```typescript
type SignTransactionOutput = {
  signedTransaction: string; // Signed transaction hex
  witnessSet: string; // Witness set hex
};
```

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const txHex = "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667...";

const result = await vault.signTransaction({
  userId: "user123",
  transaction: txHex,
});

if (isOk(result)) {
  console.log("Signed transaction:", result.signedTransaction);
  console.log("Witness set:", result.witnessSet);
}
```

#### `vault.set(key, value)`

Modifies the vault configuration in place and returns the same instance.

**Parameters:**

- `key: keyof VaultConfig` - Configuration key to modify
- `value: VaultConfig[key]` - New value

**Returns:** `this` (same Vault instance)

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod",
});

// Modify in place
vault.set("network", "mainnet");
console.log(vault.config.network); // "mainnet"
```

#### `vault.with(key, value)`

Creates a new Vault instance with modified configuration.

**Parameters:**

- `key: keyof VaultConfig` - Configuration key to modify
- `value: VaultConfig[key]` - New value

**Returns:** `Vault` (new instance)

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod",
});

// Create new instance
const mainnetVault = vault.with("network", "mainnet");

console.log(vault.config.network); // "preprod" (unchanged)
console.log(mainnetVault.config.network); // "mainnet"
```

### `deriveWallet` Function

Lower-level function for wallet derivation without creating a Vault instance:

**Parameters:**

```typescript
type DeriveWalletInput = {
  userId: string;
  rootKey: string;
  accountDerivation?: Derivation;
  paymentDerivation?: Derivation;
  stakeDerivation?: Derivation;
};
```

**Returns:** `Promise<Result<DeriveWalletOutput>>`

```typescript
type DeriveWalletOutput = {
  accountKey: Bip32PrivateKey;
  paymentKey: Bip32PrivateKey;
  stakeKey: Bip32PrivateKey;
};
```

**Example:**

```typescript
import { deriveWallet } from "@anvil-vault/vault";
import { unwrap } from "trynot";

const wallet = unwrap(
  await deriveWallet({
    userId: "user123",
    rootKey: process.env.ROOT_KEY,
    accountDerivation: { type: "constant", value: 0 },
    paymentDerivation: { type: "unique", scrambler: (i) => i.reverse() },
    stakeDerivation: { type: "pool", size: 10 },
  })
);

console.log("Account key:", wallet.accountKey.to_bech32());
console.log("Payment key:", wallet.paymentKey.to_bech32());
console.log("Stake key:", wallet.stakeKey.to_bech32());
```

## Derivation Strategies

Choose the right derivation strategy for your use case:

### Strategy Comparison

| Strategy     | Use Case                  | Security | Example                          |
| ------------ | ------------------------- | -------- | -------------------------------- |
| **Constant** | Testing, single account   | Low      | All users share account 0        |
| **Unique**   | Production payment keys   | High     | Each user gets unique address    |
| **Pool**     | Stake keys for delegation | Medium   | Share 50 stake keys across users |
| **Custom**   | Complex business logic    | Varies   | Database-driven derivation       |

### Default Behavior

If not specified, the vault uses:

- **Account**: Constant (0)
- **Payment**: Unique with reversed path (Not recommended for production)
- **Stake**: Pool of 10 keys

**Always provide custom payment derivation for production.**

### Strategy Details

**Constant Derivation:**

```typescript
accountDerivation: {
  type: "constant",
  value: 0, // Always use account 0
}
```

**Unique Derivation:**

```typescript
paymentDerivation: {
  type: "unique",
  scrambler: (path) => path.reverse(), // Optional scrambling
}
```

The scrambler transforms the derivation path for additional security:

```typescript
// Custom scrambling
scrambler: (path) => {
  const [a, b, c, d] = path;
  return [d, c, b, a];
};
```

**Pool Derivation:**

```typescript
stakeDerivation: {
  type: "pool",
  size: 100, // Pool of 100 stake keys
}
```

**Custom Derivation:**

```typescript
paymentDerivation: {
  type: "custom",
  derive: async (input, context) => {
    const userIndex = await getUserIndexFromDatabase(input.userId);
    return [0, userIndex];
  },
}
```

## Dependencies

- **`@anvil-vault/cms`**: Message signing (CIP-8/CIP-30)
- **`@anvil-vault/csl`**: CSL wrappers for key derivation and addresses
- **`@anvil-vault/handler`**: Handler types and interfaces
- **`@anvil-vault/utils`**: Shared utilities
- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano cryptography
- **`trynot`**: Result type for error handling

## Security Considerations

### Root Key Storage

Never hardcode the root key. Use secure key management:

```typescript
const vault = new Vault({
  rootKey: async () => {
    // Good: Fetch from secure storage
    return await keyManagementService.getRootKey();

    // Good: Environment variable
    return process.env.ROOT_KEY;

    // Bad: Hardcoded
    // return "xprv1...";
  },
  network: "mainnet",
});
```

### Payment Derivation

Always provide custom payment derivation with scrambling for production:

```typescript
// Good: Custom scrambled derivation
paymentDerivation: {
  type: "unique",
  scrambler: (path) => {
    const [a, b, c, d] = path;
    return [d, b, c, a];
  },
}

// Warning: Default derivation (not recommended)
// paymentDerivation: undefined
```

### User ID Security

Use non-guessable user identifiers:

```typescript
// Good: UUID
const userId = "550e8400-e29b-41d4-a716-446655440000";

// Bad: Sequential integers
// const userId = "1", "2", "3"...
```

### Memory Management

The Vault automatically frees cryptographic keys after use. Avoid storing derived keys:

```typescript
// Good: Keys are automatically cleaned up
const wallet = await vault.getWallet({ userId });

// Bad: Don't store raw keys
// const keys = await deriveWallet(...);
// globalState.keys = keys; // Memory leak!
```

### Network Configuration

Ensure network matches your deployment:

```typescript
// Production
const vault = new Vault({
  rootKey: () => process.env.MAINNET_ROOT_KEY,
  network: "mainnet",
});

// Testing
const testVault = new Vault({
  rootKey: () => process.env.TESTNET_ROOT_KEY,
  network: "preprod",
});
```

## Dependencies

- **`@anvil-vault/cms`**: Message signing (CIP-8/CIP-30)
- **`@anvil-vault/csl`**: CSL wrappers for key derivation and addresses
- **`@anvil-vault/handler`**: Handler types and interfaces
- **`@anvil-vault/utils`**: Shared utilities
- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano cryptography
- **`trynot`**: Result type for error handling

## Related Packages

- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/express](../express/README.md)**: Express adapter
- **[@anvil-vault/hono](../hono/README.md)**: Hono adapter
- **[@anvil-vault/csl](../csl/README.md)**: Cardano Serialization Library utilities
- **[@anvil-vault/cms](../cms/README.md)**: Message signing utilities
- **[@anvil-vault/bip39](../bip39/README.md)**: BIP-39 mnemonic utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord</a>
  |
  <a href="https://x.com/AnvilDevAgency">@ada_anvil</a>
</p>
