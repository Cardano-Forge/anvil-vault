# @ada-anvil/vault/cms

Cardano Message Signing (CMS) utilities for Anvil Vault. This package provides CIP-8 and CIP-30 compliant data signing for Cardano wallets using COSE (CBOR Object Signing and Encryption) standards.

## Table of Contents

- [Overview](#overview)
- [signDataWallet](#signdatawalletinput)
- [External AAD](#external-aad)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Overview

- **CIP-8**: Message Signing specification for Cardano
- **CIP-30**: Cardano dApp-Wallet Web Bridge signing standards
- **COSE Sign1**: CBOR Object Signing and Encryption for Ed25519 signatures
- **Address Verification**: Ensures private key matches the signing address

All functions return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

---

### `signDataWallet(input)`

Signs arbitrary data with a private key using CIP-8/CIP-30 wallet standards.

**Input:**

```typescript
type SignDataWalletInput {
  payload: string | Buffer; // Data to sign (hex string or Buffer)
  address: ParsedAddress; // Cardano address
  privateKey: PrivateKey; // Ed25519 private key for signing
  externalAad?: string | Buffer; // Optional external Additional Authenticated Data
}
```

**Returns:** `Result<SignDataWalletOutput>`

```typescript
type SignDataWalletOutput = {
  signature: string; // COSE Sign1 signature (hex encoded)
  key: string; // COSE Key containing the public key (hex encoded)
};
```

**Example:**

```typescript
import { signDataWallet } from "@ada-anvil/vault/cms";
import { deriveAddresses, extractKeys } from "@ada-anvil/vault/csl";
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

---

### External AAD

External Additional Authenticated Data (AAD) allows you to bind the signature to additional context without including it in the payload. This is useful for:

- Binding signatures to specific transactions or sessions
- Adding metadata that verifiers need to check
- Preventing signature reuse in different contexts

```typescript
import { signDataWallet } from "@ada-anvil/vault/cms";
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

---

## References

- [CIP-8: Message Signing](https://cips.cardano.org/cip/CIP-0008)
- [CIP-30: Cardano dApp-Wallet Web Bridge](https://cips.cardano.org/cip/CIP-0030)

---

## Dependencies

- **`@emurgo/cardano-message-signing-nodejs-gc`**: COSE signing implementation
- **`trynot`**: Result type for error handling

---

## Related Packages

- **[@ada-anvil/vault/vault](../vault/README.md)**: Vault implementation
- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@ada-anvil/vault/csl](../csl/README.md)**: Cardano Serialization Library utilities
- **[@ada-anvi/lvault/utils](../utils/README.md)**: Shared utilities

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
