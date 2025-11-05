# @anvil-vault/framework

The main entry point for Anvil Vault - a comprehensive, type-safe framework for building custodial Cardano wallets. This package re-exports all core functionality from the Anvil Vault ecosystem, providing a unified interface for wallet management, key derivation, message signing, and transaction handling.

## Installation

```bash
npm install @anvil-vault/framework
```

## Overview

Anvil Vault Framework is designed for building secure, production-ready custodial wallet solutions on Cardano. It provides:

- **Hierarchical Deterministic Wallets**: CIP-1852 compliant key derivation
- **Flexible Derivation Strategies**: Unique, constant, pool, and custom derivation patterns
- **Message Signing**: CIP-8/CIP-30 compliant data signing
- **Transaction Signing**: Full Cardano transaction support
- **Framework Adapters**: Ready-to-use integrations for Express.js and Hono
- **Type Safety**: Full TypeScript support with Result-based error handling

## Quick Start

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

// Get wallet addresses
const wallet = await vault.getWallet({ userId: "user123" });
console.log(wallet.addresses.base.bech32);

// Sign data
const signature = await vault.signData({
  userId: "user123",
  payload: "Hello, Cardano!",
});
```

## Packages

The framework is composed of several specialized packages, each handling a specific aspect of Cardano wallet functionality:

### Core Packages

#### [@anvil-vault/vault](../vault/README.md)

The main vault implementation that orchestrates wallet derivation, address generation, and signing operations.

**Main Functions:**
- `Vault` - Main vault class for managing hierarchical deterministic wallets
- `getWallet(input)` - Derive wallet addresses for a user
- `signData(input)` - Sign arbitrary data with CIP-8/CIP-30 compliance
- `signTransaction(input)` - Sign Cardano transactions
- `deriveWallet(input)` - Low-level wallet derivation

**Key Features:**
- CIP-1852 compliant key derivation
- Flexible derivation strategies (unique, constant, pool, custom)
- Automatic memory cleanup of cryptographic keys
- Base, enterprise, and reward address generation

---

#### [@anvil-vault/csl](../csl/README.md)

Cardano Serialization Library wrappers providing type-safe, Result-based interfaces for Cardano cryptographic operations.

**Main Functions:**
- `deriveAccount(input)` - Derive account keys from root key (CIP-1852)
- `extractKeys(input)` - Extract payment and stake keys from account
- `deriveAddresses(input)` - Generate base, enterprise, and reward addresses
- `signTransaction(input)` - Sign transactions with private keys
- `signData(input)` - Sign arbitrary data with Ed25519 keys
- `verifySignature(input)` - Verify Ed25519 signatures
- `parseAddress(input)` - Parse addresses from various formats
- `getNetworkId(input)` - Get network ID from address or network name

**Key Features:**
- BIP32 hierarchical deterministic key derivation
- Address generation for all Cardano address types
- Transaction and data signing
- Signature verification
- Network utilities

---

#### [@anvil-vault/cms](../cms/README.md)

Cardano Message Signing implementation following CIP-8 and CIP-30 standards using COSE (CBOR Object Signing and Encryption).

**Main Functions:**
- `signDataWallet(input)` - Sign data with CIP-8/CIP-30 wallet standards
- `verifyDataWallet(input)` - Verify CIP-8/CIP-30 signatures

**Key Features:**
- CIP-8 message signing specification
- CIP-30 dApp-Wallet Web Bridge compliance
- COSE Sign1 format for Ed25519 signatures
- Address verification to ensure key-address matching

---

#### [@anvil-vault/bip39](../bip39/README.md)

BIP-39 mnemonic utilities for deterministic mnemonic phrase generation and entropy parsing.

**Main Functions:**
- `generateMnemonic(input?)` - Generate 12 or 24-word mnemonic phrases
- `entropyToMnemonic(input)` - Convert entropy to mnemonic phrase
- `mnemonicToEntropy(input)` - Convert mnemonic phrase to entropy
- `getWordList(input?)` - Get BIP-39 wordlist in various languages

**Key Features:**
- BIP-39 compliant mnemonic generation
- Support for 12 and 24-word phrases
- Multiple language wordlists
- Entropy validation and conversion

---

#### [@anvil-vault/handler](../handler/README.md)

Framework-agnostic HTTP request handler builder for creating vault API endpoints.

**Main Functions:**
- `createVaultHandler(config)` - Create a vault request handler
- `handleVaultRequest(input)` - Process vault requests
- `createHandlerAdapter(adapter)` - Create framework-specific adapters
- `getDerivation(input)` - Parse and validate derivation parameters

**Key Features:**
- Framework-agnostic design
- Type-safe request/response handling
- Flexible derivation strategy support
- Built-in error handling

---

#### [@anvil-vault/utils](../utils/README.md)

Shared utility functions and types used across all Anvil Vault packages.

**Main Functions:**
- `errorToJson(error, opts?)` - Convert errors to JSON with status codes
- `errorToString(error)` - Convert errors to string messages
- `validate(input)` - Schema-based validation with detailed errors
- `parseHex(input)` - Parse and validate hex strings
- `parseUuid(input)` - Parse and validate UUIDs
- `isValidBech32Address(address)` - Validate Cardano bech32 addresses

**Key Features:**
- Error handling utilities
- Schema validation
- Hex and UUID parsing
- Bech32 address validation
- TypeScript helper types

---

### Framework Adapters

#### [@anvil-vault/express](../express/README.md)

Express.js adapter for integrating Anvil Vault handlers into Express applications.

**Main Functions:**
- `expressAdapter` - Adapter for Express.js request/response handling

**Key Features:**
- Seamless Express.js integration
- JSON body parsing support
- Automatic error response formatting
- Compatible with Express middleware ecosystem

**Usage:**
```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import express from "express";

const app = express();
app.use(express.json());

const handler = createVaultHandler({ vault, adapter: expressAdapter });

app.all("/users/:userId/*", handler);
```

---

#### [@anvil-vault/hono](../hono/README.md)

Hono adapter for integrating Anvil Vault handlers into Hono applications.

**Main Functions:**
- `honoAdapter` - Adapter for Hono context handling

**Key Features:**
- Fast and lightweight
- Multi-runtime support (Cloudflare Workers, Deno, Bun, Node.js)
- Full TypeScript support with Hono's type system
- Perfect for edge computing

**Usage:**
```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Hono } from "hono";

const app = new Hono();
const handler = createVaultHandler({ vault, adapter: honoAdapter });

app.all("/users/:userId/*", handler);
```

---

## Architecture

The framework follows a layered architecture:

```
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

const wallet = result; // Type-safe access
console.log(wallet.addresses.base.bech32);

// Or use unwrap (throws on error)
const wallet = unwrap(await vault.getWallet({ userId: "user123" }));
```

## Security Best Practices

1. **Root Key Management**: Never hardcode root keys. Use environment variables or secure key management systems.
2. **Derivation Strategies**: Use unique derivation with scrambling for payment keys to prevent address correlation.
3. **Memory Cleanup**: The vault automatically cleans up cryptographic keys from memory.
4. **Network Isolation**: Always specify the correct network (mainnet/testnet) to prevent address confusion.
5. **Input Validation**: All inputs are validated using schema-based validation.

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  Vault,
  VaultConfig,
  DeriveWalletOutput,
  Derivation,
  Network,
} from "@anvil-vault/framework";
```

## License

ISC

## Contributing

Contributions are welcome! Please see the main repository for contribution guidelines.

## Support

For issues, questions, or contributions, please visit the [Anvil Vault repository](https://github.com/Cardano-Forge/anvil-vault).