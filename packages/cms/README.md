# @anvil-vault/cms

Cardano Message Signing (CMS) utilities for Anvil Vault. This package provides CIP-8 and CIP-30 compliant data signing for Cardano wallets using COSE (CBOR Object Signing and Encryption) standards.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Overview](#overview)
- [API Reference](#api-reference)
  - [signDataWallet](#signdatawalletinput)
- [Advanced Usage](#advanced-usage)
  - [External AAD](#external-aad)
- [Technical Details](#technical-details)
  - [COSE Sign1 Structure](#cose-sign1-structure)
  - [Validation](#validation)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/cms
```

## Quick Start

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { isOk } from "trynot";

const result = signDataWallet({
  payload: Buffer.from("Hello, Cardano!", "utf8"),
  privateKey: paymentPrivateKey,
  address,
});

if (isOk(result)) {
  console.log("Signature:", result.signature);
  console.log("Public key:", result.key);
}
```

## Overview

The `@anvil-vault/cms` package implements:

- **CIP-8**: Message Signing specification for Cardano
- **CIP-30**: Cardano dApp-Wallet Web Bridge signing standards
- **COSE Sign1**: CBOR Object Signing and Encryption for Ed25519 signatures
- **Address Verification**: Ensures private key matches the signing address

All functions return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

## API Reference

### `signDataWallet(input)`

Signs arbitrary data with a private key using CIP-8/CIP-30 wallet standards.

**Parameters:**

- `input.payload: string | Buffer` - Data to sign (hex string or Buffer)
- `input.address: ParsedAddress` - Cardano address
- `input.privateKey: PrivateKey` - Ed25519 private key for signing
- `input.externalAad?: string | Buffer` - Optional external Additional Authenticated Data

**Returns:** `Result<SignDataWalletOutput>`

- `signature: string` - COSE Sign1 signature (hex encoded)
- `key: string` - COSE Key containing the public key (hex encoded)

**Example:**

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { deriveAddresses, extractKeys } from "@anvil-vault/csl";
import { isOk, unwrap } from "trynot";

// Get payment key and address
const { paymentKey, stakeKey } = unwrap(
  extractKeys({
    accountKey, // Hex format account key
    paymentDerivation: 0,
    stakeDerivation: 0,
  })
);

const addresses = unwrap(
  deriveAddresses({
    paymentKey,
    stakeKey,
    network: "mainnet",
  })
);

// Sign a message
const result = signDataWallet({
  payload: Buffer.from("Hello, Cardano!", "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
});

if (isOk(result)) {
  console.log("Signature:", result.signature);
  console.log("Public key:", result.key);
}
```

## Advanced Usage

### External AAD

External Additional Authenticated Data (AAD) allows you to bind the signature to additional context without including it in the payload. This is useful for:

- Binding signatures to specific transactions or sessions
- Adding metadata that verifiers need to check
- Preventing signature reuse in different contexts

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { isOk } from "trynot";

const result = signDataWallet({
  payload: Buffer.from("Transaction data", "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
  externalAad: Buffer.from("session-id-12345", "utf8"),
});

if (isOk(result)) {
  console.log("Signed with external AAD:", result.signature);
}
```

## Technical Details

**Reference:**

- [CIP-8: Message Signing](https://cips.cardano.org/cip/CIP-0008)
- [CIP-30: Cardano dApp-Wallet Web Bridge](https://cips.cardano.org/cip/CIP-0030)

### COSE Sign1 Structure

The signature follows the COSE Sign1 format with these protected headers:

- **Algorithm ID**: EdDSA (-8)
- **Key ID**: Address bytes
- **Address**: Custom header containing the signing address

The COSE Key includes:

- **Key Type**: OKP (Octet Key Pair, value 1)
- **Algorithm ID**: EdDSA (-8)
- **Curve**: Ed25519 (crv: 6)
- **Public Key**: x-coordinate (-2)

### Validation

The function performs these validations:

1. **Script Address Check**: Cannot sign with script addresses (only key hash addresses)
2. **Key Match Verification**: Private key must match the payment credential of the address
3. **Address Credential**: Address must have a valid payment key hash

## Dependencies

- **`@emurgo/cardano-message-signing-nodejs-gc`**: COSE signing implementation
- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano types (dev dependency)
- **`@anvil-vault/utils`**: Shared utilities (parseFromHex)
- **`@anvil-vault/csl`**: CSL wrappers (dev dependency for types)
- **`trynot`**: Result type for error handling

## Related Packages

- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/csl](../csl/README.md)**: Cardano Serialization Library utilities
- **[@anvil-vault/utils](../utils/README.md)**: Shared utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord Invite</a>
  |
  <a href="https://x.com/AnvilDevAgency">X: @AnvilDevAgency</a>
</p>
