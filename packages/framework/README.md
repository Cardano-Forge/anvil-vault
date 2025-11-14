<div align="center">
  <h1>Anvil Vault Framework</h1>
  <p>
    <strong>Unified, type-safe custodial wallet framework for Cardano</strong>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@anvil-vault/framework"><img src="https://img.shields.io/npm/v/@anvil-vault/framework.svg" alt="npm version"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript"></a>
  </p>
</div>

## Table of Contents

- [About](#about)
- [Why Use the Framework?](#why-use-the-framework)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Complete Example](#complete-example)
- [What's Exported](#whats-exported)
- [Architecture](#architecture)
- [Package Comparison](#package-comparison)
- [Packages](#packages)
  - [Core Packages](#core-packages)
  - [Framework Adapters](#framework-adapters)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [TypeScript Support](#typescript-support)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Scripts](#scripts)
- [Support](#support)

## About

`@anvil-vault/framework` is the **main entry point** for Anvil Vault - a comprehensive, production-ready custodial wallet solution for Cardano. This package conveniently re-exports all core functionality, allowing you to import everything from a single package while maintaining full type safety and modularity.

## Why Use the Framework?

**Choose `@anvil-vault/framework` when:**
- You want a batteries-included solution with one `npm install`
- You need multiple Anvil Vault features (vault + handlers + adapters)
- You prefer importing from a single package namespace
- You're building a complete custodial wallet service

**Choose individual packages when:**
- You only need specific functionality (e.g., just CSL wrappers)
- You want to minimize bundle size
- You're building custom wallet logic
- You need fine-grained dependency control

## Getting Started

### Installation

```bash
npm install @anvil-vault/framework
```

### Quick Start

```typescript
import { Vault } from "@anvil-vault/framework";
import { isOk } from "trynot";

// Create a vault instance
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY!,
  network: "preprod",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});

// Get wallet addresses
const result = await vault.getWallet({ userId: "user-123" });

if (isOk(result)) {
  console.log("Base address:", result.addresses.base.bech32);
  console.log("Enterprise address:", result.addresses.enterprise.bech32);
  console.log("Reward address:", result.addresses.reward.bech32);
}
```

### Complete Example

Full Express.js integration with REST API endpoints:

```typescript
import { Vault, createVaultHandler, expressAdapter } from "@anvil-vault/framework";
import express from "express";

// 1. Create vault with secure configuration
const vault = new Vault({
  rootKey: async () => {
    // Fetch from secure storage (never hardcode!)
    return process.env.ROOT_KEY!;
  },
  network: "preprod",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(), // Prevent address correlation
  },
  stakeDerivation: {
    type: "pool",
    size: 100, // Share 100 stake keys across users
  },
});

// 2. Create Express app
const app = express();
app.use(express.json()); // Required for POST requests

// 3. Mount vault handler - automatically creates REST endpoints
app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);

// 4. Start server
app.listen(3000, () => {
  console.log("Vault API running on http://localhost:3000");
});

// Available endpoints:
// GET  /users/:userId/wallet          - Get addresses
// POST /users/:userId/sign-data      - Sign data (CIP-8/CIP-30)
// POST /users/:userId/sign-transaction - Sign transaction
```

## What's Exported

The framework conveniently re-exports everything you need from core packages:

```typescript
// Core Vault
export { Vault, deriveWallet } from "@anvil-vault/vault";
export type {
  VaultConfig,
  GetWalletOutput,
  SignDataOutput,
  SignTransactionOutput,
  DeriveWalletOutput,
} from "@anvil-vault/vault";

// Cardano Serialization Library Wrappers
export {
  deriveAccount,
  derivePrivateKey,
  extractKeys,
  deriveAddresses,
  parseAddress,
  signTransaction,
  addRequiredSigner,
  signDataRaw,
  verifySignature,
  generateEd25519KeyPair,
  getNetworkId,
  harden,
} from "@anvil-vault/csl";
export type { Network, NetworkId, ParsedAddress } from "@anvil-vault/csl";

// Message Signing (CIP-8/CIP-30)
export { signDataWallet } from "@anvil-vault/cms";
export type { SignDataWalletInput, SignDataWalletOutput } from "@anvil-vault/cms";

// BIP-39 Mnemonic
export { generateMnemonic, parseEntropy, getWordList } from "@anvil-vault/bip39";
export type {
  GenerateMnemonicInput,
  GenerateMnemonicOutput,
  ParseEntropyInput,
  ParseEntropyOutput,
} from "@anvil-vault/bip39";

// HTTP Handler Builder
export { createVaultHandler, handleVaultRequest, getDerivation } from "@anvil-vault/handler";
export type {
  IVault,
  HandlerAdapter,
  Derivation,
  VaultConfig as HandlerVaultConfig,
} from "@anvil-vault/handler";

// Framework Adapters
export { expressAdapter } from "@anvil-vault/express";
export type { ExpressAdapter } from "@anvil-vault/express";

export { honoAdapter } from "@anvil-vault/hono";
export type { HonoAdapter } from "@anvil-vault/hono";

// Utilities
export {
  errorToJson,
  errorToString,
  parseFromHex,
  uuidToByteArray,
  isBech32Address,
  VaultError,
  ValidationError,
  stringSchema,
  objectSchema,
} from "@anvil-vault/utils";
export type { MaybePromise, Schema, ParsedSchema } from "@anvil-vault/utils";
```

**Key Features:**

- **Hierarchical Deterministic Wallets**: CIP-1852 compliant derivation with flexible strategies
- **Message Signing**: CIP-8 and CIP-30 compliant data signing using COSE
- **Transaction Signing**: Sign transactions with automatic witness generation
- **Framework Agnostic**: Built-in adapters for Express and Hono, extensible to any framework
- **Type Safety**: Full TypeScript support with comprehensive type exports
- **Error Handling**: Consistent `Result` types from `trynot` library

## Architecture

Understanding how packages work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    @anvil-vault/framework                   │
│                    (Convenience Package)                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │    Vault     │  │   Handler    │  │   Adapters   │
   │   (Core)     │  │ (REST API)   │  │(Express/Hono)│
   └──────────────┘  └──────────────┘  └──────────────┘
          │                  │
          ▼                  ▼
   ┌──────────────┐  ┌──────────────┐
   │     CSL      │  │     CMS      │
   │  (Crypto)    │  │  (Signing)   │
   └──────────────┘  └──────────────┘
          │
          ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │    BIP-39    │  │    Utils     │  │   Emurgo     │
   │ (Mnemonics)  │  │ (Utilities)  │  │   CSL Lib    │
   └──────────────┘  └──────────────┘  └──────────────┘
```

**Package Responsibilities:**

1. **Framework**: Single entry point, re-exports everything
2. **Vault**: High-level wallet orchestration and key derivation
3. **Handler**: Framework-agnostic REST API builder
4. **Adapters**: Framework-specific integration (Express, Hono)
5. **CSL**: Type-safe wrappers around Cardano Serialization Library
6. **CMS**: Cardano Message Signing (CIP-8/CIP-30) implementation
7. **BIP-39**: Mnemonic generation and parsing
8. **Utils**: Shared utilities (error handling, validation, parsing)

## Package Comparison

Choose the right approach for your use case:

| Approach | Installation | Use Case | Bundle Size | Flexibility |
|----------|-------------|----------|-------------|-------------|
| **Framework** | `@anvil-vault/framework` | Complete custodial wallet service | Largest | High |
| **Vault Only** | `@anvil-vault/vault` | Core wallet without REST API | Medium | High |
| **CSL Only** | `@anvil-vault/csl` | Low-level Cardano operations | Small | Maximum |
| **Individual** | Pick what you need | Custom implementation | Smallest | Maximum |

**Example: Minimal Bundle**

If you only need address generation:

```bash
npm install @anvil-vault/csl @anvil-vault/utils trynot
```

```typescript
import { deriveAccount, extractKeys, deriveAddresses } from "@anvil-vault/csl";
import { unwrap } from "trynot";

const { accountKey } = unwrap(
  deriveAccount({ rootKey: process.env.ROOT_KEY, accountDerivation: 0 })
);
const { paymentKey, stakeKey } = unwrap(
  extractKeys({ accountKey, paymentDerivation: 0, stakeDerivation: 0 })
);
const addresses = unwrap(
  deriveAddresses({ paymentKey, stakeKey, network: "mainnet" })
);
```

## Packages

The framework is composed of specialized packages:

### Core Packages

#### [@anvil-vault/vault](../vault/README.md)

- Main vault orchestration for key derivation, address generation, and signing operations
- CIP-1852 compliant derivation with flexible strategies

#### [@anvil-vault/csl](../csl/README.md)

- Type-safe wrappers around Cardano Serialization Library
- Derivation, address generation, signing, verification, parsing, and network utilities

#### [@anvil-vault/cms](../cms/README.md)

- Cardano Message Signing (CIP-8/CIP-30) using COSE
- Sign and verify wallet messages

#### [@anvil-vault/bip39](../bip39/README.md)

- BIP-39 mnemonic generation and entropy parsing

#### [@anvil-vault/handler](../handler/README.md)

- Framework-agnostic HTTP handler builder and derivation utilities

#### [@anvil-vault/utils](../utils/README.md)

- Shared utilities for error handling, validation, parsing, and helper types

### Framework Adapters

#### [@anvil-vault/express](../express/README.md)

- Adapter to use handlers with Express.js

#### [@anvil-vault/hono](../hono/README.md)

- Adapter to use handlers with Hono across multiple runtimes

## Error Handling

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent, type-safe error handling:

```typescript
import { isOk, unwrap } from "trynot";

const result = await vault.getWallet({ userId: "user123" });

if (isOk(result)) {
  console.log(result.addresses.base.bech32);
}

// Or unwrap (throws on error)
const unwrapped = unwrap(await vault.getWallet({ userId: "user123" }));
```

## Security Best Practices

- Root keys must never be hardcoded. Use environment variables or a key management system.
- Use unique derivation with scrambling for payment keys to prevent address correlation.
- Sensitive key material is automatically freed after use; avoid logging keys.
- Specify the correct network (mainnet or testnets) and isolate environments.
- Validate all inputs using schema-based validation.

## TypeScript Support

Full TypeScript support with comprehensive type exports and excellent inference:

```typescript
import type {
  // Vault Types
  Vault,
  VaultConfig,
  GetWalletOutput,
  SignDataOutput,
  SignTransactionOutput,
  DeriveWalletOutput,
  // Network Types
  Network,
  NetworkId,
  // Derivation Types
  Derivation,
  // CSL Types
  ParsedAddress,
  // Handler Types
  IVault,
  HandlerAdapter,
  // Utility Types
  MaybePromise,
  Schema,
  ParsedSchema,
} from "@anvil-vault/framework";

// Example: Type-safe vault configuration
const config: VaultConfig = {
  rootKey: () => process.env.ROOT_KEY!,
  network: "preprod", // Autocomplete: "mainnet" | "preprod" | "preview" | 0 | 1
  paymentDerivation: {
    type: "unique", // Autocomplete: "unique" | "pool" | "constant" | "custom"
    scrambler: (path) => path.reverse(),
  },
};

// Example: Type inference on results
const result = await vault.getWallet({ userId: "user-123" });
if (isOk(result)) {
  // TypeScript knows the exact shape:
  const bech32: string = result.addresses.base.bech32;
  const hex: string = result.addresses.base.hex;
}
```

## Troubleshooting

### Common Issues

**Q: Getting "Cannot find module '@anvil-vault/framework'"**

A: Make sure you've installed the package:
```bash
npm install @anvil-vault/framework
```

**Q: Express adapter returns empty body**

A: You must use `express.json()` middleware before the vault handler:
```typescript
app.use(express.json()); // Required!
app.use(createVaultHandler({ vault, adapter: expressAdapter }));
```

**Q: "Default payment derivation is not secure for production" warning**

A: Always specify a custom payment derivation with scrambling:
```typescript
const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(), // Add this!
  },
});
```

**Q: How do I test without a real root key?**

A: Generate a test mnemonic and derive a root key:
```typescript
import { generateMnemonic, derivePrivateKey } from "@anvil-vault/framework";
import { unwrap } from "trynot";

const { mnemonic } = unwrap(generateMnemonic({ wordCount: 24 }));
const entropy = Buffer.from(mnemonic.split(" ").join(""), "utf8");
const rootKey = unwrap(derivePrivateKey({ entropy }));
console.log("Test root key:", rootKey.to_bech32());
```

**Q: Getting 404 errors on vault endpoints**

A: Check that:
1. You're using the correct path format: `/users/:userId/wallet`
2. The userId is a valid string (UUIDs recommended)
3. The HTTP method matches (GET for wallet, POST for signing)

**Q: Transaction signing fails with "Private key doesn't match"**

A: Ensure the transaction inputs use the correct address. The vault signs with the user's derived payment key, so transaction inputs must spend from that user's addresses.

### Debug Tips

**Enable verbose error messages:**
```typescript
import { errorToString } from "@anvil-vault/framework";
import { isErr } from "trynot";

const result = await vault.getWallet({ userId });
if (isErr(result)) {
  console.error("Error details:", errorToString(result, { cause: true }));
}
```

**Verify address derivation:**
```typescript
const result = await vault.getWallet({ userId: "test-user" });
if (isOk(result)) {
  console.log("Addresses:", {
    base: result.addresses.base.bech32,
    enterprise: result.addresses.enterprise.bech32,
    reward: result.addresses.reward.bech32,
  });
}
```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/Cardano-Forge/anvil-vault/issues)
- **Discord**: [Join our Discord](https://discord.gg/yyTG6wUqCh)
- **Documentation**: Individual package READMEs for detailed API docs
- **Examples**: See [examples/](../../examples) for complete working examples

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Scripts

```bash
# Build all packages
npm run build

# Type check all packages
npm run check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Support

For issues, questions, or contributions, please visit the [Anvil Vault repository](https://github.com/Cardano-Forge/anvil-vault).

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord</a>
  |
  <a href="https://x.com/AnvilDevAgency">Twitter</a>
</p>
