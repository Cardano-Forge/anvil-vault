# Anvil Vault

> A secure, production-ready custodial wallet infrastructure for Cardano blockchain applications

## Overview

Anvil Vault is a comprehensive TypeScript monorepo that provides everything you need to build secure custodial wallet solutions on Cardano. Built with security, flexibility, and developer experience in mind, it offers a complete toolkit from low-level cryptographic operations to high-level HTTP handlers.

### Why Anvil Vault?

- **Security First**: BIP39/BIP32 compliant key derivation with automatic memory cleanup
- **Production Ready**: Battle-tested cryptographic operations with comprehensive error handling
- **Framework Agnostic**: Built-in adapters for Express and Hono, easily extensible to any framework
- **Type Safe**: Full TypeScript support with strict type checking and Result-based error handling
- **Flexible**: Multiple derivation strategies (unique, pool, constant, custom) for any use case
- **Modular**: Use the complete framework or individual packages as needed
- **Standards Compliant**: CIP-8, CIP-30, and CIP-1852 compliant implementations

## Getting Started

### Documentation

**For complete documentation, API reference, and usage examples, see:**

**[Framework Documentation](./packages/framework/README.md)** - Complete entry point for Anvil Vault

## Monorepo Structure

Anvil Vault is organized as a monorepo with specialized packages for different concerns:

### Main Package

- **[`@anvil-vault/framework`](./packages/framework/README.md)** - Complete framework package that re-exports all core functionality.

### Core Packages

- **[`@anvil-vault/vault`](./packages/vault/README.md)** - Main vault implementation with hierarchical deterministic wallet derivation, address generation, and signing operations
- **[`@anvil-vault/csl`](./packages/csl/README.md)** - Type-safe wrappers around Cardano Serialization Library for key derivation, address generation, and transaction signing
- **[`@anvil-vault/cms`](./packages/cms/README.md)** - Cardano Message Signing (CIP-8/CIP-30) implementation using COSE standards
- **[`@anvil-vault/handler`](./packages/handler/README.md)** - Framework-agnostic HTTP request handler builder with REST API endpoints
- **[`@anvil-vault/bip39`](./packages/bip39/README.md)** - BIP-39 mnemonic generation and entropy parsing utilities

### Framework Adapters

- **[`@anvil-vault/express`](./packages/express/README.md)** - Express.js adapter for seamless integration with Express applications
- **[`@anvil-vault/hono`](./packages/hono/README.md)** - Hono adapter for modern, lightweight applications (Cloudflare Workers, Deno, Bun, Node.js)

### Utilities

- **[`@anvil-vault/utils`](./packages/utils/README.md)** - Shared utilities including error handling, validation, parsing, and type utilities

### Build Configuration

- **`@anvil-vault/tsconfig`** - Shared TypeScript configuration for consistent type checking
- **`@anvil-vault/tsup`** - Build configuration utilities for package compilation

### Layer Responsibilities

**Application Layer:**

- `vault`: Orchestrates wallet operations and key management
- `handler`: Provides REST API endpoints and request handling
- `express`/`hono`: Framework-specific adapters

**Cryptographic Layer:**

- `csl`: Cardano-specific cryptographic operations
- `cms`: Message signing standards (CIP-8/CIP-30)
- `bip39`: Mnemonic and entropy handling
- `utils`: Common utilities and error handling

## Key Features

### Secure Key Derivation

- **BIP39 Mnemonic Generation**: Create secure 12 or 24-word mnemonic phrases
- **BIP32 HD Derivation**: Hierarchical deterministic key derivation following CIP-1852
- **Flexible Strategies**: Unique, pool, constant, or custom derivation patterns
- **Memory Safety**: Automatic cleanup of cryptographic keys

### Transaction & Data Signing

- **Transaction Signing**: Sign Cardano transactions with automatic witness set generation
- **CIP-8/CIP-30 Compliance**: Standards-compliant data signing for dApp integration
- **COSE Format**: CBOR Object Signing and Encryption for Ed25519 signatures
- **Address Verification**: Ensures private key matches signing address

### Framework Integration

- **Express.js**: Full middleware support with authentication, rate limiting, and error handling
- **Hono**: Multi-runtime support (Cloudflare Workers, Deno, Bun, Node.js)
- **Custom Adapters**: Easy to create adapters for any framework
- **Type Safety**: Full TypeScript support with framework-specific types

### Developer Experience

- **Result Types**: Consistent error handling with `trynot` library
- **Comprehensive Docs**: Detailed documentation for every package
- **Type Inference**: Excellent TypeScript type inference
- **Examples**: Complete working examples for common use cases

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

## Examples

Complete, runnable examples are available in the `examples/` directory:

- **[Express Example](./examples/express/README.md)** - Complete Express.js integration example with code walkthrough
- **[Hono Example](./examples/hono/README.md)** - Modern Hono framework example with code walkthrough

Each example includes:

- Complete implementation code
- API endpoint documentation with curl examples
- Configuration options

## Security Considerations

**Critical Security Guidelines:**

1. **Root Key Management**

   - Never hardcode root keys in your application
   - Use environment variables or secure key management systems (AWS KMS, HashiCorp Vault, etc.)
   - Rotate keys regularly and have a key rotation strategy

2. **Derivation Strategies**

   - Always use unique derivation with scrambling for payment keys
   - The default payment derivation is NOT secure for production
   - Use pool derivation for stake keys to consolidate rewards

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/RN4D7wzc">Discord</a>
  |
  <a href="https://x.com/ada_anvil">@ada_anvil</a>
</p>
