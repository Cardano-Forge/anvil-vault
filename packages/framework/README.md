<div align="center">
  <h1>Anvil Vault</h1>
  <p>
    <strong>Custodial wallet framework for Cardano</strong>
  </p>
<p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.3.3+-blue.svg" alt="TypeScript"></a>
    <a href="https://www.npmjs.com/"><img src="https://img.shields.io/badge/npm-10.2.3-blue.svg" alt="npm version"></a>
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
- [Security Considerations](#security-considerations)
- [Error Handling](#error-handling)
- [Getting Help](#getting-help)

## About

`@ada-anvil/vault` is a comprehensive custodial wallet solution for Cardano.

## Why Anvil Vault?

- **Hierarchical Deterministic (HD) Wallets**: Generate unlimited addresses from a single seed phrase, following Cardano's CIP-1852
  standard
- **Message & Transaction Signing**: Sign blockchain transactions and messages with full CIP-8 and CIP-30 compliance
- **Type-Safe Blockchain Integration**: Comprehensive TypeScript wrappers around Cardano Serialization Library (CSL)
- **Framework Agnostic**: Drop-in adapters for Express.js and Hono
- **Modern Error Handling**: Type-safe Result patterns using `trynot`

## Getting Started

### Installation

```bash
npm install @ada-anvil/vault
```

### Quick Start

See the [Vault Quick Start Guide](../vault/README.md#usage) for a complete walkthrough.

### Examples

For complete working examples:

- **[Express Example](../../examples/express/README.md)** - Full Express.js integration
- **[Hono Example](../../examples/hono/README.md)** - Full Hono integration

## Packages

Anvil Vault is composed of specialized packages:

### Core Packages

#### [@ada-anvil/vault](../vault/README.md)

- Core vault orchestration for key derivation, address generation, and signing operations
- CIP-1852 compliant derivation with flexible strategies

> [!WARNING]
> **Peer Dependencies** <br/>- **`@emurgo/cardano-message-signing-nodejs-gc`**: COSE signing implementation <br/>- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano cryptography

#### [@ada-anvil/vault/csl](../csl/README.md)

- Type-safe wrappers around Cardano Serialization Library
- Derivation, address generation, signing, verification, parsing, and network utilities

> [!WARNING]
> **Peer Dependencies** <br/>- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano cryptography

#### [@ada-anvil/vault/cms](../cms/README.md)

- Cardano Message Signing (CIP-8/CIP-30) using COSE
- Sign and verify wallet messages

> [!WARNING]
> **Peer Dependencies** <br/>- **`@emurgo/cardano-message-signing-nodejs-gc`**: COSE signing implementation

#### [@ada-anvil/vault/bip39](../bip39/README.md)

- BIP-39 mnemonic generation and entropy parsing

> [!WARNING]
> **Peer Dependencies** <br/>- **`bip39`**: BIP-39 mnemonic operations and wordlist management

#### [@ada-anvil/vault/handler](../handler/README.md)

- Framework-agnostic HTTP handler builder and derivation utilities

#### [@ada-anvil/vault/utils](../utils/README.md)

- Shared utilities for error handling, validation, parsing, and helper types

### Framework Adapters

#### [@ada-anvil/vault/express](../express/README.md)

- Adapter to use handlers with Express.js

#### [@ada-anvil/vault/hono](../hono/README.md)

- Adapter to use handlers with Hono

---

## Security Considerations

### Root Key Management

> [!WARNING]
> **Your root key is the master secret that controls all wallets.**
> If compromised, an attacker can access all user funds.

- **Never hardcode root keys** in your source code or configuration files
- Store root keys in dedicated key management systems
- Use different keys per environment

### Derivation Strategies (User Address Generation)

**How you generate user addresses directly impacts security and privacy.**

#### Payment Keys (Spending Addresses)

- **Never use `constant` derivation in production** - this generates the same address for all users, creating a security and privacy
  vulnerability
- **Always use `unique` derivation with scrambling** - this ensures each user gets cryptographically isolated addresses
- The `pool` strategy was designed for stake keys (see below)

#### Stake Keys (Reward Addresses)

- **Use `pool` derivation for stake keys** - this allows you to consolidate all users' staking rewards to a set of addresses for easier
  management. Each user is deterministically assigned one of the available addresses
- Pool derivation is safe for stake keys because they don't control spendable funds

---

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

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Cardano-Forge/anvil-vault/issues)
- **Discord**: [Join our Discord](https://discord.gg/yyTG6wUqCh)
- **Documentation**: Individual package READMEs for detailed API docs
- **Examples**: See [examples/](../../examples) for complete working examples

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">
    <img src="../../logo/discord.svg" alt="Discord Icon" height="18px" style="vertical-align: text-top;" /> Discord
  </a>
  |
  <a href="https://x.com/AnvilDevAgency">
    <img src="../../logo/x.svg" alt="X Icon" height="18px" style="vertical-align: text-top;" /> @AnvilDevAgency
  </a>
</p>
