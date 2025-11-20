<div align="center">
  <h1>Anvil Vault Framework</h1>
  <p>
    <strong>Unified, type-safe custodial wallet framework for Cardano</strong>
  </p>
  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript"></a>
  </p>
</div>

## Table of Contents

- [About](#about)
- [Why Anvil Vault?](#why-anvil-vault)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Examples](#examples)
- [Packages](#packages)
  - [Core Packages](#core-packages)
  - [Framework Adapters](#framework-adapters)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Scripts](#scripts)
- [Support](#support)

## About

`@anvil-vault/framework` is the **main entry point** for Anvil Vault - a comprehensive custodial wallet solution for Cardano.

## Why Anvil Vault?

- **Framework Agnostic**: Built-in adapters for Express and Hono
- **HD Wallets**: CIP-1852 compliant hierarchical deterministic wallets
- **Message & Transaction Signing**: CIP-8 and CIP-30 compliant data signing
- **Type-Safe CSL Wrapper**: Comprehensive TypeScript wrappers around Cardano Serialization Library
- **Flexible Derivation**: Multiple strategies (unique, pool, constant, custom)
  **Standardize Error Handling**: Result types from `trynot` library

## Getting Started

### Installation

```bash
npm install @anvil-vault/framework
```

### Quick Start

See the [Vault Quick Start Guide](../vault/README.md#quick-start) for a complete walkthrough.

### Examples

For complete working examples:

- **[Express Example](../../examples/express/README.md)** - Full Express.js integration
- **[Hono Example](../../examples/hono/README.md)** - Full Hono integration

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

## Security Considerations

### Root Key Management

- Never hardcode root keys in your application
- Use environment variables or secure key management systems (AWS KMS, HashiCorp Vault, etc.)

### Derivation Strategies

- Always use unique derivation with scrambling for payment keys
- The default payment derivation is NOT secure for production
- Use pool derivation for stake keys to consolidate rewards

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
  <a href="https://x.com/AnvilDevAgency">AnvilDevAgency</a>
</p>
