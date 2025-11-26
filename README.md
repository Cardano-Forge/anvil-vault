# Anvil Vault

> **ANVIL DEVELOPMENT ONLY**  
> This monorepo is for developper at Anvil Dev Agency.  
> **@anvil-vault/framework is the main entry for OSS.**

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Development](#development)

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

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord Invite</a>
  |
  <a href="https://x.com/AnvilDevAgency">X: @AnvilDevAgency</a>
</p>
