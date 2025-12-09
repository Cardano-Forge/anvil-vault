# Anvil Vault

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Development](#development)

## Monorepo Structure

Anvil Vault is organized as a monorepo with specialized packages for different concerns:

### Main Package

- **[`@ada-anvil/vault/framework`](./packages/framework/README.md)** - Complete entry point for Anvil Vault

### Core Packages

- **[`@ada-anvil/vault/vault`](./packages/vault/README.md)** - Main vault implementation with hierarchical deterministic wallet derivation
- **[`@ada-anvil/vault/csl`](./packages/csl/README.md)** - Type-safe wrappers around Cardano Serialization Library
- **[`@ada-anvil/vault/cms`](./packages/cms/README.md)** - Cardano Message Signing (CIP-8/CIP-30) implementation using COSE standards
- **[`@ada-anvil/vault/handler`](./packages/handler/README.md)** - Framework-agnostic HTTP request handler builder with REST API endpoints
- **[`@ada-anvil/vault/bip39`](./packages/bip39/README.md)** - BIP-39 mnemonic generation and entropy parsing utilities

### Framework Adapters

- **[`@ada-anvil/vault/express`](./packages/express/README.md)** - Express.js adapter
- **[`@ada-anvil/vault/hono`](./packages/hono/README.md)** - Hono adapter

### Utilities

- **[`@ada-anvil/vault/utils`](./packages/utils/README.md)** - Shared utilities

### Build Configuration

- **`@ada-anvil/vault/tsconfig`** - Shared TypeScript configuration
- **`@ada-anvil/vault/tsup`** - Build configuration utilities

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
  <a href="https://discord.gg/yyTG6wUqCh">
    <img src="../../logo/discord.svg" alt="Discord Icon" height="18px" style="vertical-align: text-top;" /> Discord
  </a>
  |
  <a href="https://x.com/AnvilDevAgency">
    <img src="../../logo/x.svg" alt="X Icon" height="18px" style="vertical-align: text-top;" /> @AnvilDevAgency
  </a>
</p>
