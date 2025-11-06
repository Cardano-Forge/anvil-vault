# @anvil-vault/vault

Core vault implementation for Anvil Vault. This package provides the `Vault` class that manages hierarchical deterministic wallet derivation, address generation, data signing, and transaction signing for Cardano.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Vault Class](#vault-class)
    - [Constructor](#constructor)
    - [vault.getWallet](#vaultgetwalletinput)
    - [vault.signData](#vaultsigndatainput)
    - [vault.signTransaction](#vaultsigntransactioninput)
    - [vault.set](#vaultsetkey-value)
    - [vault.with](#vaultwithkey-value)
- [Derivation Strategies](#derivation-strategies)
  - [Constant Derivation](#constant-derivation)
  - [Unique Derivation](#unique-derivation)
  - [Pool Derivation](#pool-derivation)
  - [Custom Derivation](#custom-derivation)
- [Default Derivations](#default-derivations)
- [Advanced Configuration](#advanced-configuration)
  - [Custom Wallet Derivation](#custom-wallet-derivation)
  - [Additional Wallet Derivation](#additional-wallet-derivation)
- [Complete Example: Multi-User Wallet System](#complete-example-multi-user-wallet-system)
- [Memory Management](#memory-management)
- [Error Handling](#error-handling)
- [Usage with Handler](#usage-with-handler)
- [Helper Function: deriveWallet](#helper-function-derivewallet)
- [Dependencies](#dependencies)
- [Security Considerations](#security-considerations)

## Installation

```bash
npm install @anvil-vault/vault
```

## Overview

The Vault package provides:

- **Hierarchical Deterministic Wallets**: CIP-1852 compliant key derivation
- **Address Generation**: Base, enterprise, and reward addresses
- **Data Signing**: CIP-8/CIP-30 compliant message signing
- **Transaction Signing**: Sign Cardano transactions with derived keys
- **Flexible Derivation Strategies**: Constant, unique, pool, and custom derivations
- **Memory Management**: Automatic cleanup of cryptographic keys

All functions return `Result` types from the `trynot` library for consistent error handling.

## Quick Start

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});

// Get wallet addresses
const wallet = await vault.getWallet({ userId: "user123" });
console.log(wallet.addresses.base.bech32);

// Sign data
const signature = await vault.signData({
  userId: "user123", // uuid
  payload: "Hello, Cardano!",
});

// Sign transaction
const signed = await vault.signTransaction({
  userId: "user123", // uuid
  transaction: txHex,
});
```

## API Reference

- [Vault Class](#vault-class)
  - [Constructor](#constructor)
  - [vault.getWallet](#vaultgetwalletinput)
  - [vault.signData](#vaultsigndatainput)
  - [vault.signTransaction](#vaultsigntransactioninput)
  - [vault.set](#vaultsetkey-value)
  - [vault.with](#vaultwithkey-value)

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
import { isErr } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const result = await vault.getWallet({ userId: "user123" });

if (!isErr(result)) {
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
import { isErr } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const result = await vault.signData({
  userId: "user123", // uuid
  payload: Buffer.from("Verify my identity", "utf8"),
});

if (!isErr(result)) {
  console.log("Signature:", result.signature);
  console.log("Public key:", result.key);
}

// With external AAD
const resultWithAad = await vault.signData({
  userId: "user123", // uuid
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
import { isErr } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const txHex = "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667...";

const result = await vault.signTransaction({
  userId: "user123", // uuid
  transaction: txHex,
});

if (!isErr(result)) {
  console.log("Signed transaction:", result.signedTransaction);
  console.log("Witness set:", result.witnessSet);

  // Submit to blockchain
  await submitTransaction(result.signedTransaction);
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

## Derivation Strategies

Anvil Vault supports multiple derivation strategies for account, payment, and stake keys:

### Constant Derivation

Always uses the same derivation index.

```typescript
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  accountDerivation: {
    type: "constant",
    value: 0, // Always use account 0
  },
});
```

**Use Case:** Single account for all users (not recommended for production).

### Unique Derivation

Derives a unique key for each user based on their userId.

```typescript
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(), // Optional: scramble the derivation path
  },
});
```

**Use Case:** Each user gets a unique payment address.

**Scrambler Function:**

The scrambler function transforms the derivation path for additional security:

```typescript
// Reverse the path
scrambler: (path) => path.reverse();

// Custom scrambling
scrambler: (path) => {
  const [a, b, c, d] = path;
  return [d, c, b, a];
};
```

### Pool Derivation

Distributes users across a pool of keys.

```typescript
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  stakeDerivation: {
    type: "pool",
    size: 100, // Pool of 100 stake keys
  },
});
```

**Use Case:** Share stake keys across users for delegation efficiency.

### Custom Derivation

Provide a custom function to determine derivation paths.

```typescript
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "custom",
    derive: async (input, context) => {
      // Custom logic based on userId (example)
      const userIndex = await getUserIndexFromDatabase(input.userId);
      return [0, userIndex];
    },
  },
});
```

**Use Case:** Complex derivation logic based on external data.

## Default Derivations

The `DEFAULT_VAULT_DERIVATIONS` constant provides sensible defaults:

```typescript
import { DEFAULT_VAULT_DERIVATIONS } from "@anvil-vault/vault";

console.log(DEFAULT_VAULT_DERIVATIONS);
// {
//   account: { type: "constant", value: 0 },
//   payment: { type: "unique", scrambler: (i) => i.reverse() },
//   stake: { type: "pool", size: 10 }
// }
```

**Default Behavior:**

- **Account**: Constant (account 0)
- **Payment**: Unique per user with reversed path
- **Stake**: Pool of 10 keys

**Warning:** If you don't provide a `paymentDerivation`, the vault will warn you:

```
ANVIL VAULT WARNING: Using unsafe default payment derivation.
Please provide a custom payment derivation strategy in your vault config.
```

Suppress this warning:

```typescript
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  ignoreDefaultPaymentDerivationWarning: true,
});
```

## Advanced Configuration

### Custom Wallet Derivation

Completely override the default wallet derivation logic:

```typescript
import { Vault } from "@anvil-vault/vault";
import { Bip32PrivateKey } from "@emurgo/cardano-serialization-lib-nodejs-gc";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  customWalletDerivation: async (input, config) => {
    // Completely custom derivation logic
    const rootKey = await config.rootKey();
    const rootKeyParsed = Bip32PrivateKey.from_hex(rootKey);

    // Your custom derivation
    const accountKey = rootKeyParsed.derive(0).derive(0).derive(0);
    const paymentKey = accountKey.derive(0).derive(0);
    const stakeKey = accountKey.derive(2).derive(0);

    return {
      accountKey,
      paymentKey,
      stakeKey,
    };
  },
});
```

### Additional Wallet Derivation

Modify keys after standard derivation:

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
  additionalWalletDerivation: async (keys, input, config) => {
    // Modify derived keys
    // For example, add an extra derivation level
    const enhancedPaymentKey = keys.paymentKey.derive(1);

    return {
      ...keys,
      paymentKey: enhancedPaymentKey,
    };
  },
});
```

## Complete Example: Multi-User Wallet System

```typescript
import { Vault } from "@anvil-vault/vault";
import { isErr, unwrap } from "trynot";

// 1. Create vault with secure configuration
const vault = new Vault({
  rootKey: async () => {
    // Fetch from secure key management system
    return await getSecureRootKey();
  },
  network: "mainnet",
  accountDerivation: {
    type: "constant",
    value: 0,
  },
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => {
      // Custom scrambling for security
      const [a, b, c, d] = path;
      return [d, b, c, a];
    },
  },
  stakeDerivation: {
    type: "pool",
    size: 50, // 50 stake keys for delegation
  },
});

// 2. Get wallet for user
const userId = "user123";
const wallet = unwrap(await vault.getWallet({ userId }));

console.log("User wallet:", wallet.addresses.base.bech32);

// 3. Sign a message for authentication
const authMessage = `Login at ${Date.now()}`;
const authSignature = unwrap(
  await vault.signData({
    userId,
    payload: Buffer.from(authMessage, "utf8"),
  })
);

console.log("Auth signature:", authSignature.signature);

// 4. Sign a transaction
const tx = await buildTransaction({
  from: wallet.addresses.base.bech32,
  to: "addr1...",
  amount: 1000000,
});

const signedTx = unwrap(
  await vault.signTransaction({
    userId,
    transaction: tx.to_hex(),
  })
);

console.log("Signed transaction:", signedTx.signedTransaction);

// 5. Submit to blockchain
await submitTransaction(signedTx.signedTransaction);
```

## Memory Management

The Vault automatically manages memory for cryptographic keys:

- Keys are automatically freed after use
- Prevents memory leaks from WASM objects
- Safe for long-running applications

```typescript
// Keys are automatically cleaned up
const result = await vault.getWallet({ userId: "user123" });
// Internal keys are freed after this call
```

## Error Handling

All methods return `Result` types from the `trynot` library:

```typescript
import { isErr, isOk, unwrap } from "trynot";
import { Vault } from "@anvil-vault/vault";
import { VaultError } from "@anvil-vault/utils";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

// Check for errors
const result = await vault.getWallet({ userId: "user123" });

if (isErr(result)) {
  if (result instanceof VaultError) {
    console.error("Vault error:", result.message);
    console.error("Status code:", result.statusCode);
  } else {
    console.error("Error:", result.message);
  }
  return;
}

// Use the value
console.log("Wallet:", result.addresses.base.bech32);

// Or unwrap (throws on error)
const wallet = unwrap(await vault.getWallet({ userId: "user123" }));
```

## Usage with Handler

The Vault is typically used with the `@anvil-vault/handler` package:

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { Vault } from "@anvil-vault/vault";
import { expressAdapter } from "@anvil-vault/handler/express";

const handler = createVaultHandler({
  vault: new Vault({
    rootKey: () => process.env.ROOT_KEY,
    network: "preprod",
    paymentDerivation: {
      type: "unique",
      scrambler: (path) => path.reverse(),
    },
  }),
  adapter: expressAdapter,
});

// Use with Express
app.use("/vault", handler);
```

## Helper Function: `deriveWallet`

The package also exports a lower-level `deriveWallet` function:

```typescript
import { deriveWallet } from "@anvil-vault/vault";
import { unwrap } from "trynot";

const wallet = unwrap(
  await deriveWallet({
    userId: "user123", // uuid
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

## Dependencies

- **`@anvil-vault/cms`**: Message signing (CIP-8/CIP-30)
- **`@anvil-vault/csl`**: CSL wrappers for key derivation and addresses
- **`@anvil-vault/handler`**: Handler types and interfaces
- **`@anvil-vault/utils`**: Shared utilities
- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano cryptography
- **`trynot`**: Result type for error handling

## Security Considerations

1. **Root Key Storage**: Never hardcode the root key. Use environment variables or secure key management systems.

2. **Payment Derivation**: Always provide a custom payment derivation strategy with a scrambler for production use.

3. **Network Configuration**: Ensure the network matches your deployment environment.

4. **Memory Management**: The vault automatically frees keys, but avoid storing derived keys in memory.

5. **User ID Security**: User IDs should be non-guessable (use UUIDs, not sequential integers).
