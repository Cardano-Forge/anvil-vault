# Anvil Vault

> A secure, custodial wallet infrastructure for Cardano blockchain applications

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## Overview

Anvil Vault is a TypeScript monorepo providing a complete custodial wallet solution for Cardano. It offers secure key derivation, transaction signing, and data signing capabilities with flexible derivation strategies and framework-agnostic HTTP handlers.

### Key Features

- **Secure Key Management**: BIP39 mnemonic generation and hierarchical deterministic (HD) key derivation
- **Transaction Signing**: Sign Cardano transactions with automatic witness set generation
- **Data Signing**: CIP-30 compliant data signing with optional external AAD
- **Flexible Derivation**: Multiple derivation strategies (unique, pool, constant, custom)
- **Framework Agnostic**: Built-in adapters for Express and Hono with extensible adapter pattern
- **Type Safe**: Full TypeScript support with strict type checking
- **Modern Stack**: ESM and CommonJS builds, Vitest for testing, Turbo for builds
- **Error Handling**: Consistent error handling with `trynot` library

## Architecture

Anvil Vault is organized as a monorepo with the following packages:

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
- **`@anvil-vault/tsconfig`**: Shared TypeScript configuration
- **`@anvil-vault/tsup`**: Build configuration utilities

### Meta Package

- **`@anvil-vault/framework`**: Convenience package that re-exports all core packages

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd anvil-vault

# Install dependencies
npm install

# Run linting, type checking, and tests
npm run pre

# Build all packages
npm run build
```

### Using in Your Project

```bash
# Install the framework package (includes all core packages)
npm install @anvil-vault/framework

# Or install individual packages
npm install @anvil-vault/vault @anvil-vault/handler @anvil-vault/express
```

## Quick Start

### Express Example

```typescript
import { expressAdapter } from "@anvil-vault/express";
import { createVaultHandler } from "@anvil-vault/handler";
import { Vault } from "@anvil-vault/vault";
import express from "express";

const app = express();
app.use(express.json());

app.use(
  createVaultHandler({
    vault: new Vault({
      rootKey: () => process.env.ROOT_KEY,
      network: "preprod",
      paymentDerivation: {
        type: "unique",
        scrambler: (path) => path.reverse(),
      },
    }),
    adapter: {
      ...expressAdapter,
      getPath: (ctx) => ctx.req.path,
    },
  })
);

app.listen(3000, () => console.log("Vault running on port 3000"));
```

### Hono Example

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

const app = new Hono();

app.use(
  createVaultHandler({
    vault: new Vault({
      rootKey: () => process.env.ROOT_KEY,
      network: "mainnet",
      paymentDerivation: {
        type: "unique",
        scrambler: (path) => path.reverse(),
      },
    }),
    adapter: {
      ...honoAdapter,
      getPath: (ctx) => ctx.req.path,
    },
  })
);
```

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

## Development

### Project Structure

```bash
anvil-vault/
├── packages/
│   ├── bip39/              # BIP39 mnemonic utilities
│   ├── cms/                # Cardano message signing
│   ├── csl/                # CSL wrappers
│   ├── express/            # Express adapter
│   ├── framework/          # Meta package
│   ├── handler/            # Request handler builder
│   ├── hono/               # Hono adapter
│   ├── tsconfig/           # Shared TypeScript config
│   ├── tsup/               # Build utilities
│   ├── utils/              # Shared utilities
│   └── vault/              # Core vault implementation
├── examples/
│   ├── express/            # Express example app
│   └── hono/               # Hono example app
├── package.json            # Root workspace config
├── turbo.json              # Turbo build config
└── biome.json              # Linting/formatting config
```

### Available Scripts

```bash
# Development
npm run dev              # Watch mode for all packages
npm run build            # Build all packages
npm run emit             # Generate TypeScript declarations

# Code Quality
npm run lint             # Run Biome linting and formatting
npm run check            # TypeScript type checking
npm run pre              # Run lint + check + test (pre-commit)

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode testing

# Maintenance
npm run build:clean      # Clean build artifacts
npm run knip             # Find unused dependencies
npm run sherif           # Check dependency consistency
```

### Code Conventions

- **TypeScript**: Strict mode enabled, no implicit any
- **Formatting**: Biome for linting and formatting
- **Testing**: Vitest with co-located `.test.ts` files
- **Error Handling**: Use `trynot` library, never throw in public APIs
- **Validation**: Always use Zod for runtime validation
- **Imports**: No file extensions in import statements
- **Exports**: Provide both CommonJS and ESM builds

### Testing Guidelines

- Use `assert()` from `trynot` instead of non-null assertions (`!`)
- After `assert(isOk(value))` or `assert(isErr(value))`, access values directly
- Co-locate test files with source files using `.test.ts` extension
- Run `npm run test:watch` during development

### Error Handling Pattern

```typescript
import { isErr, unwrap, parseError, type Result } from "trynot";

// Return errors, don't throw
function parseAddress(address: string): Result<Address> {
  try {
    return Address.from_bech32(address);
  } catch (error) {
    return parseError(error);
  }
}

// Check for errors
const address = parseAddress(userInput);
if (isErr(address)) {
  return new VaultError({ message: address.message, statusCode: 400 });
}

// Or unwrap (throws on error)
const safeAddress = unwrap(parseAddress(userInput));
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Root Key Management**: Never hardcode root keys. Use environment variables or secure key management systems.
2. **Default Derivation Warning**: The default payment derivation is not secure for production. Always provide a custom `scrambler` function.
3. **Network Isolation**: Use different root keys for mainnet and testnets.
4. **Memory Management**: Private keys are automatically freed after use via RAII pattern.
5. **HTTPS Required**: Always use HTTPS in production to protect API communications.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run pre` to ensure code quality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

ISC License - see individual package.json files for details.

## Author

Cardano-Forge

## Support

For issues, questions, or contributions, please open an issue on the repository.
