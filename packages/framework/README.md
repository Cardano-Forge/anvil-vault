<div align="center">
  <h3>Anvil Vault Framework</h3>
  <p>
    Unified, type-safe custodial wallet framework for Cardano
    <br />
    <a href="https://github.com/Cardano-Forge/anvil-vault/issues/new?labels=bug&template=bug_report.yml">Report Bug</a>
    ·
    <a href="https://github.com/Cardano-Forge/anvil-vault/issues/new?labels=enhancement&template=feature_request.yml">Request Feature</a>
  </p>
</div>

## Table of Contents

- [About](#about)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Examples](#examples)
- [Usage](#usage)
  - [Express Adapter](#express-adapter)
  - [Hono Adapter](#hono-adapter)
- [API Overview](#api-overview)
- [Packages](#packages)
  - [Core Packages](#core-packages)
  - [Framework Adapters](#framework-adapters)
- [Architecture](#architecture)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [TypeScript Support](#typescript-support)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## About

`@anvil-vault/framework` is the main entry point for Anvil Vault. It re-exports core functionality to build secure, production-ready custodial wallet solutions on Cardano with a consistent, type-safe API.

## Getting Started

### Installation

```bash
npm install @anvil-vault/framework
```

### Quick Start

```typescript
import { Vault } from "@anvil-vault/framework";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});

const wallet = await vault.getWallet({ userId: "user123" });
console.log(wallet.addresses.base.bech32);

const signature = await vault.signData({
  userId: "user123",
  payload: "Hello, Cardano!",
});
```

### Examples

- [Express Example](../../examples/express/README.md)
- [Hono Example](../../examples/hono/README.md)

## Usage

### Express Adapter

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import express from "express";

const app = express();
app.use(express.json());

const handler = createVaultHandler({ vault, adapter: expressAdapter });
app.all("/users/:userId/*", handler);
```

### Hono Adapter

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Hono } from "hono";

const app = new Hono();
const handler = createVaultHandler({ vault, adapter: honoAdapter });
app.all("/users/:userId/*", handler);
```

## API Overview

The framework re-exports key building blocks for:

- Hierarchical deterministic wallet derivation (CIP-1852)
- Message signing (CIP-8/CIP-30)
- Transaction signing and witness generation
- Framework-agnostic HTTP request handling via adapters

Deep-dive package documentation is available in the [Packages](#packages) section.

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

---

#### [@anvil-vault/handler](../handler/README.md)

- Framework-agnostic HTTP handler builder and derivation utilities

#### [@anvil-vault/utils](../utils/README.md)

- Shared utilities for error handling, validation, parsing, and helper types

### Framework Adapters

#### [@anvil-vault/express](../express/README.md)

- Adapter to use handlers with Express.js

#### [@anvil-vault/hono](../hono/README.md)

- Adapter to use handlers with Hono across multiple runtimes

## Architecture

```text
┌─────────────────────────────────────────┐
│         @anvil-vault/framework          │  ← Main entry point
└─────────────────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
  ┌────────┐  ┌────────┐  ┌─────────┐
  │ vault  │  │handler │  │ express │     ← Core & Adapters
  └────────┘  └────────┘  │  hono   │
       │           │       └─────────┘
  ┌────┼───────────┼────┐
  ▼    ▼           ▼    ▼
┌─────┐┌─────┐  ┌─────┐┌─────┐
│ csl ││ cms │  │utils││bip39│           ← Utilities
└─────┘└─────┘  └─────┘└─────┘
```

## Error Handling

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent, type-safe error handling:

```typescript
import { isErr, unwrap } from "trynot";

const result = await vault.getWallet({ userId: "user123" });

if (isErr(result)) {
  console.error("Error:", result.message);
  return;
}

const wallet = result;
console.log(wallet.addresses.base.bech32);

const unwrapped = unwrap(await vault.getWallet({ userId: "user123" }));
```

## Security Best Practices

- Root keys must never be hardcoded. Use environment variables or a key management system.
- Use unique derivation with scrambling for payment keys to prevent address correlation.
- Sensitive key material is automatically freed after use; avoid logging keys.
- Specify the correct network (mainnet or testnets) and isolate environments.
- Validate all inputs using schema-based validation.

## TypeScript Support

```typescript
import type {
  Vault,
  VaultConfig,
  DeriveWalletOutput,
  Derivation,
  Network,
} from "@anvil-vault/framework";
```

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

## Contributing

Please see the main repository for contribution guidelines.

## License

ISC

## Support

For issues, questions, or contributions, please visit the [Anvil Vault repository](https://github.com/Cardano-Forge/anvil-vault).
