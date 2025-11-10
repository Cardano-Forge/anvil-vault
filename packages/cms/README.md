# @anvil-vault/cms

Cardano Message Signing (CMS) utilities for Anvil Vault. This package provides CIP-8 and CIP-30 compliant data signing for Cardano wallets using COSE (CBOR Object Signing and Encryption) standards.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Functions](#functions)
  - [signDataWallet](#signdatawalletinput)
  - [Type Definitions](#type-definitions)
  - [COSE Sign1 Structure](#cose-sign1-structure)
  - [Validation](#validation)
- [Complete Example: Sign and Verify](#complete-example-sign-and-verify)
- [Usage in Anvil Vault](#usage-in-anvil-vault)
- [CIP Standards](#cip-standards)
- [Error Handling](#error-handling)
- [Dependencies](#dependencies)

## Installation

```bash
npm install @anvil-vault/cms
```

## Overview

The CMS package implements:

- **CIP-8**: Message Signing specification for Cardano
- **CIP-30**: Cardano dApp-Wallet Web Bridge signing standards
- **COSE Sign1**: CBOR Object Signing and Encryption for Ed25519 signatures
- **Address Verification**: Ensures private key matches the signing address

All functions return `Result` types from the `trynot` library for consistent error handling.

## Functions

- [signDataWallet](#signdatawalletinput)
- [Type Definitions](#type-definitions)
- [COSE Sign1 Structure](#cose-sign1-structure)
- [Validation](#validation)

### `signDataWallet(input)`

Signs arbitrary data with a private key using CIP-8/CIP-30 wallet standards. The signature is COSE Sign1 formatted and includes the signing address in the protected headers.

**Parameters:**

- `input.payload: string | Buffer` - Data to sign (hex string or Buffer)
- `input.address: ParsedAddress` - Cardano address (BaseAddress, EnterpriseAddress, or RewardAddress)
- `input.privateKey: PrivateKey` - Ed25519 private key for signing
- `input.externalAad?: string | Buffer` - Optional external Additional Authenticated Data

**Returns:** `Result<SignDataWalletOutput>`

- `signature: string` - COSE Sign1 signature (hex encoded)
- `key: string` - COSE Key containing the public key (hex encoded)

**Example:**

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { deriveAddresses, extractKeys } from "@anvil-vault/csl";
import { isErr, unwrap } from "trynot";

// Get payment key and address
const { paymentKey, stakeKey } = unwrap(
  extractKeys({
    accountKey,
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
const message = "Hello, Cardano!";
const result = signDataWallet({
  payload: Buffer.from(message, "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
});

if (!isErr(result)) {
  console.log("Signature:", result.signature);
  console.log("Public key:", result.key);

  // These can be used for verification by dApps
  const signatureHex = result.signature;
  const publicKeyHex = result.key;
}
```

**With External AAD:**

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { isErr } from "trynot";

const result = signDataWallet({
  payload: Buffer.from("Transaction data", "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
  externalAad: Buffer.from("Additional context", "utf8"),
});

if (!isErr(result)) {
  console.log("Signed with external AAD:", result.signature);
}
```

**Address Types:**

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { isErr, unwrap } from "trynot";

// Sign with Enterprise Address (payment only)
const enterpriseResult = signDataWallet({
  payload: Buffer.from("message", "utf8"),
  address: addresses.enterpriseAddress,
  privateKey: paymentKey.to_raw_key(),
});

// Sign with Base Address (payment + stake)
const baseResult = signDataWallet({
  payload: Buffer.from("message", "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
});

// Sign with Reward Address (stake only)
const rewardResult = signDataWallet({
  payload: Buffer.from("message", "utf8"),
  address: addresses.rewardAddress,
  privateKey: stakeKey.to_raw_key(), // Use stake key for reward address
});
```

## Type Definitions

### `SignDataWalletInput`

```typescript
type SignDataWalletInput = {
  payload: string | Buffer;
  address: ParsedAddress;
  privateKey: PrivateKey;
  externalAad?: string | Buffer;
};
```

### `SignDataWalletOutput`

```typescript
type SignDataWalletOutput = {
  signature: string; // COSE Sign1 hex
  key: string; // COSE Key hex
};
```

## COSE Sign1 Structure

The signature follows the COSE Sign1 format with these protected headers:

- **Algorithm ID**: EdDSA (-8)
- **Key ID**: Address bytes
- **Address**: Custom header containing the signing address

The COSE Key includes:

- **Key Type**: OKP (Octet Key Pair, value 1)
- **Algorithm ID**: EdDSA (-8)
- **Curve**: Ed25519 (crv: 6)
- **Public Key**: x-coordinate (-2)

## Validation

The function performs several validations:

1. **Script Address Check**: Cannot sign with script addresses (only key hash addresses)
2. **Key Match Verification**: Private key must match the payment credential of the address
3. **Address Credential**: Address must have a valid payment key hash

**Error Cases:**

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { isErr } from "trynot";

// Error: Script address
const scriptResult = signDataWallet({
  payload: Buffer.from("data", "utf8"),
  address: scriptAddress, // Has script hash instead of key hash
  privateKey: paymentKey.to_raw_key(),
});

if (isErr(scriptResult)) {
  console.error(scriptResult.message); // "Can't sign data with script address"
}

// Error: Mismatched private key
const mismatchResult = signDataWallet({
  payload: Buffer.from("data", "utf8"),
  address: addresses.baseAddress, // Uses payment key
  privateKey: stakeKey.to_raw_key(), // Wrong key!
});

if (isErr(mismatchResult)) {
  console.error(mismatchResult.message); // "Private key doesn't match the address"
}
```

## Complete Example: Sign and Verify

Here's a complete example showing how to sign data and verify it:

```typescript
import { signDataWallet } from "@anvil-vault/cms";
import { deriveAddresses, extractKeys } from "@anvil-vault/csl";
import {
  COSESign1,
  COSEKey,
  Label,
} from "@emurgo/cardano-message-signing-nodejs-gc";
import { Ed25519Signature } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { isErr, unwrap } from "trynot";

// 1. Setup wallet
const { paymentKey, stakeKey } = unwrap(
  extractKeys({
    accountKey,
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

// 2. Sign the message
const message = "Verify my identity";
const signResult = signDataWallet({
  payload: Buffer.from(message, "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
});

if (isErr(signResult)) {
  throw new Error("Failed to sign: " + signResult.message);
}

const { signature, key } = signResult;

// 3. Verify the signature (typically done by a dApp)
const coseSign1 = COSESign1.from_bytes(Buffer.from(signature, "hex"));
const coseKey = COSEKey.from_bytes(Buffer.from(key, "hex"));

// Verify the signature
const sigStructure = coseSign1.signed_data(undefined, undefined).to_bytes();
const sig = Ed25519Signature.from_bytes(coseSign1.signature());
const publicKey = paymentKey.to_public().to_raw_key();
const isValid = publicKey.verify(sigStructure, sig);

console.log("Signature valid:", isValid); // true

// Verify the payload
const payload = coseSign1.payload();
if (payload) {
  const recoveredMessage = Buffer.from(payload).toString("utf8");
  console.log("Message:", recoveredMessage); // "Verify my identity"
}

// Verify the address
const protectedHeaders = coseSign1.headers().protected().deserialized_headers();
const addressHeader = protectedHeaders.header(Label.new_text("address"));
if (addressHeader) {
  const addressBytes = addressHeader.as_bytes();
  const recoveredAddress = Buffer.from(addressBytes).toString("hex");
  console.log("Address:", recoveredAddress);
}
```

## Usage in Anvil Vault

The `signDataWallet` function is used internally by the Vault's `signData` endpoint:

```typescript
// In @anvil-vault/vault
import { signDataWallet } from "@anvil-vault/cms";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

// The vault uses signDataWallet internally
const result = await vault.signData({
  userId: "user123",
  payload: "0x48656c6c6f",
});
```

## CIP Standards

This package implements:

### CIP-8: Message Signing

Defines the standard for signing arbitrary messages in Cardano wallets:

- Uses COSE Sign1 structure
- Includes signing address in protected headers
- Supports external Additional Authenticated Data (AAD)

### CIP-30: dApp-Wallet Web Bridge

Defines the `signData` API for wallet-dApp communication:

- Returns signature and public key in COSE format
- Enables dApps to verify user identity
- Compatible with browser wallet extensions

**Reference:**

- [CIP-8: Message Signing](https://cips.cardano.org/cip/CIP-0008)
- [CIP-30: Cardano dApp-Wallet Web Bridge](https://cips.cardano.org/cip/CIP-0030)

## Error Handling

All functions return `Result` types from the `trynot` library:

```typescript
import { isErr, isOk, unwrap } from "trynot";
import { signDataWallet } from "@anvil-vault/cms";

// Check for errors
const result = signDataWallet({
  payload: Buffer.from("data", "utf8"),
  address: addresses.baseAddress,
  privateKey: paymentKey.to_raw_key(),
});

if (isErr(result)) {
  console.error("Failed to sign:", result.message);
  return;
}

// Use the value
console.log("Signature:", result.signature);

// Or unwrap (throws on error)
const { signature, key } = unwrap(
  signDataWallet({
    payload: Buffer.from("data", "utf8"),
    address: addresses.baseAddress,
    privateKey: paymentKey.to_raw_key(),
  })
);
```

## Dependencies

- **`@emurgo/cardano-message-signing-nodejs-gc`**: COSE signing implementation
- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano types (dev dependency)
- **`@anvil-vault/utils`**: Shared utilities (parseFromHex)
- **`@anvil-vault/csl`**: CSL wrappers (dev dependency for types)
- **`trynot`**: Result type for error handling

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord</a>
  |
  <a href="https://x.com/AnvilDevAgency">@ada_anvil</a>
</p>
