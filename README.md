# Anvil Vault

> A secure, custodial wallet infrastructure for Cardano blockchain applications

## Overview

Anvil Vault is a TypeScript monorepo providing a complete custodial wallet solution for Cardano. It offers secure key derivation, transaction signing, and data signing capabilities with flexible derivation strategies and framework-agnostic HTTP handlers.

### Key Features

- **Secure Key Management**: BIP39 mnemonic generation and hierarchical deterministic (HD) key derivation
- **Transaction Signing**: Sign Cardano transactions with automatic witness set generation
- **Data Signing**: CIP-30 compliant data signing with optional external AAD
- **Flexible Derivation**: Multiple derivation strategies (unique, pool, constant, custom)
- **Framework Agnostic**: Built-in adapters for Express and Hono with extensible adapter pattern
- **Type Safe**: Full TypeScript support with strict type checking
- **Error Handling**: Consistent error handling with `trynot` library

## Architecture

Anvil Vault is organized as a monorepo with the following packages:

### Main Package

- **`@anvil-vault/framework`**: Convenience package that re-exports all core packages

### Core Packages

- **`@anvil-vault/vault`**: Main vault implementation with wallet derivation and signing logic
- **`@anvil-vault/csl`**: Cardano Serialization Library wrappers and utilities
- **`@anvil-vault/cms`**: Cardano Message Signing (CIP-8/CIP-30) implementation
- **`@anvil-vault/handler`**: Framework-agnostic HTTP request handler builder
- **`@anvil-vault/bip39`**: BIP39 mnemonic generation and entropy parsing

### Framework Adapters

- **`@anvil-vault/express`**: Express.js adapter for vault handlers
- **`@anvil-vault/hono`**: Hono adapter for vault handlers

### Utilities

- **`@anvil-vault/utils`**: Shared utilities and helper functions

### Build Configuration

- **`@anvil-vault/tsconfig`**: Shared TypeScript configuration
- **`@anvil-vault/tsup`**: Build configuration utilities

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Using in Your Project

```bash
# Install the framework package (includes all core packages)
npm install @anvil-vault/framework

# Or install individual packages
npm install @anvil-vault/vault @anvil-vault/handler @anvil-vault/express
```

## Quick Start

Anvil Vault provides framework-agnostic handlers with built-in adapters for popular web frameworks.

### Basic Usage

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { Vault } from "@anvil-vault/vault";

const handler = createVaultHandler({
  vault: new Vault({
    rootKey: () => process.env.ROOT_KEY,
    network: "preprod",
    paymentDerivation: {
      type: "unique",
      scrambler: (path) => path.reverse(),
    },
  }),
  adapter: yourFrameworkAdapter,
});
```

### Framework Examples

For complete, runnable examples with detailed documentation:

- **[Express Example](./examples/express/README.md)** - Full Express.js integration with API endpoints
- **[Hono Example](./examples/hono/README.md)** - Modern Hono framework integration

Each example includes:

- Complete implementation code
- API endpoint documentation with curl examples
- Configuration options
- Security best practices
- Troubleshooting guides

## API Reference

### Vault Configuration

```typescript
interface VaultConfig {
  // Required
  rootKey: () => MaybePromise<Bip32PrivateKey | string>;
  network: "mainnet" | "preprod" | "preview" | 0 | 1;

  // Optional derivation strategies
  accountDerivation?: Derivation;
  paymentDerivation?: Derivation;
  stakeDerivation?: Derivation;

  // Advanced customization
  customWalletDerivation?: (input, config) => MaybePromise<Result<DeriveWalletOutput>>;
  additionalWalletDerivation?: (keys, input, config) => MaybePromise<Result<DeriveWalletOutput>>;
  ignoreDefaultPaymentDerivationWarning?: boolean;
}
```

### Derivation Strategies

#### Unique Derivation

Generates a unique derivation path for each user:

```typescript
{
  type: "unique",
  scrambler?: (path: number[], input, context) => MaybePromise<Result<number[]>>
}
```

#### Pool Derivation

Uses a fixed pool of derivation indices:

```typescript
{
  type: "pool",
  size: number  // Number of indices in the pool
}
```

#### Constant Derivation

Uses a fixed derivation path:

```typescript
{
  type: "constant",
  value: number | number[]  // Fixed index or path
}
```

#### Custom Derivation

Fully custom derivation logic:

```typescript
{
  type: "custom",
  provider: (input, context) => MaybePromise<Result<number | number[] | Derivation>>
}
```

### HTTP Endpoints

The vault handler exposes three REST endpoints:

#### Get Wallet

```http
GET /users/:userId/wallet
```

Returns wallet addresses (base, enterprise, and reward).

**Response:**

```json
{
  "addresses": {
    "base": {
      "bech32": "addr_test1...",
      "hex": "00..."
    },
    "enterprise": {
      "bech32": "addr_test1...",
      "hex": "60..."
    },
    "reward": {
      "bech32": "stake_test1...",
      "hex": "e0..."
    }
  }
}
```

#### Sign Data

```http
POST /users/:userId/sign-data
Content-Type: application/json

{
  "payload": "hex-encoded-data",
  "externalAad": "optional-hex-encoded-aad"
}
```

Signs arbitrary data using CIP-8/CIP-30 standard.

**Response:**

```json
{
  "signature": "hex-encoded-signature",
  "key": "hex-encoded-public-key"
}
```

#### Sign Transaction

```http
POST /users/:userId/sign-transaction
Content-Type: application/json

{
  "transaction": "hex-encoded-transaction"
}
```

Signs a Cardano transaction.

**Response:**

```json
{
  "signedTransaction": "hex-encoded-signed-tx",
  "witnessSet": "hex-encoded-witness-set"
}
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Root Key Management**: Never hardcode root keys. Use environment variables or secure key management systems.
2. **Default Derivation Warning**: The default payment derivation is not secure for production. Always provide a custom `scrambler` function.
3. **Network Isolation**: Use different root keys for mainnet and testnets.
4. **Memory Management**: Private keys are automatically freed after use via RAII pattern.
5. **HTTPS Required**: Always use HTTPS in production to protect API communications.
