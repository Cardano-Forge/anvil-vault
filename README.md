# Anvil Vault

> A secure, production-ready custodial wallet infrastructure for Cardano blockchain applications

## Table of Contents

- [Overview](#overview)
- [Why Anvil Vault?](#why-anvil-vault)
- [Features](#features)
- [Monorepo Structure](#monorepo-structure)
- [Examples](#examples)
- [Development](#development)
- [Security Considerations](#security-considerations)

## Overview

Anvil Vault is a comprehensive TypeScript monorepo that provides everything you need to build secure custodial wallet solutions on Cardano.

### Why Anvil Vault?

- **Type-Safe CSL Wrapper**: Comprehensive TypeScript wrappers around Cardano Serialization Library with `trynot` error handling
- **Framework Agnostic**: Built-in adapters for Express and Hono, easily extensible to any framework
- **Flexible Derivation**: Multiple strategies (unique, pool, constant, custom) with automatic memory cleanup
- **Standards Compliant**: CIP-8, CIP-30, and CIP-1852 compliant implementations
- **Modular Architecture**: Use the complete framework or individual packages as needed
- **Developer Experience**: Full TypeScript support with comprehensive documentation and working examples

## Monorepo Structure

Anvil Vault is organized as a monorepo with specialized packages for different concerns:

### Main Package

- **[`@anvil-vault/framework`](./packages/framework/README.md)** - Complete entry point for Anvil Vault

### Core Packages

- **[`@anvil-vault/vault`](./packages/vault/README.md)** - Main vault implementation with hierarchical deterministic wallet derivation
- **[`@anvil-vault/csl`](./packages/csl/README.md)** - Type-safe wrappers around Cardano Serialization Library
- **[`@anvil-vault/cms`](./packages/cms/README.md)** - Cardano Message Signing (CIP-8/CIP-30) implementation using COSE standards
- **[`@anvil-vault/handler`](./packages/handler/README.md)** - Framework-agnostic HTTP request handler builder with REST API endpoints
- **[`@anvil-vault/bip39`](./packages/bip39/README.md)** - BIP-39 mnemonic generation and entropy parsing utilities

### Framework Adapters

- **[`@anvil-vault/express`](./packages/express/README.md)** - Express.js adapter
- **[`@anvil-vault/hono`](./packages/hono/README.md)** - Hono adapter

### Utilities

- **[`@anvil-vault/utils`](./packages/utils/README.md)** - Shared utilities

### Build Configuration

- **`@anvil-vault/tsconfig`** - Shared TypeScript configuration
- **`@anvil-vault/tsup`** - Build configuration utilities

## Features

### Transaction & Data Signing

- **Transaction Signing**: Sign Cardano transactions with automatic witness set generation
- **CIP-8/CIP-30 Compliance**: Standards-compliant data signing for dApp integration
- **COSE Format**: CBOR Object Signing and Encryption for Ed25519 signatures
- **Address Verification**: Ensures private key matches signing address

### Framework Integration

- **Express.js**: Full middleware support
- **Hono**: Multi-runtime support
- **Custom Adapters**: Easy to create adapters for any framework
- **Type Safety**: Full TypeScript support with framework-specific types

### Developer Experience

- **Result Types**: Consistent error handling with `trynot` library
- **Type Inference**: Excellent TypeScript type inference
- **Examples**: Complete working examples for common use cases

## Examples

- **[Express Example](./examples/express/README.md)** - Complete Express.js integration example
- **[Hono Example](./examples/hono/README.md)** - Complete Hono integration example

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/Cardano-Forge/anvil-vault.git
cd anvil-vault

# Install dependencies
npm install

# Build all packages
npm run build

# Run all checks: lint, check, test
npm run pre

# Run tests in watch mode
npm run test:watch
```

## Security Considerations

**Critical Security Guidelines:**

1. **Root Key Management**

   - Never hardcode root keys in your application
   - Use environment variables or secure key management systems (AWS KMS, HashiCorp Vault, etc.)

2. **Derivation Strategies**

   - Always use unique derivation with scrambling for payment keys
   - The default payment derivation is NOT secure for production
   - Use pool derivation for stake keys to consolidate rewards

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord</a>
  |
  <a href="https://x.com/AnvilDevAgency">@ada_anvil</a>
</p>
