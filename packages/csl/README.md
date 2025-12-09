# @ada-anvil/vault/csl

Cardano Serialization Library (CSL) wrappers and utilities for Anvil Vault. This package provides type-safe, Result-based wrappers around the Emurgo Cardano Serialization Library.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Functions](#functions)
  - [deriveAccount](#deriveaccountinput)
  - [derivePrivateKey](#deriveprivatekeyinput)
  - [extractKeys](#extractkeysinput)
  - [harden](#hardennum)
  - [deriveAddresses](#deriveaddressesinput)
  - [parseAddress](#parseaddressinput)
  - [signTransaction](#signtransactioninput)
  - [addRequiredSigner](#addrequiredsignerinput)
  - [signDataRaw](#signdatarawinput)
  - [verifySignature](#verifysignatureinput)
  - [generateEd25519KeyPair](#generateed25519keypair)
  - [getNetworkId](#getnetworkidnetwork)
- [Dependencies](#dependencies)

## Functions

### `deriveAccount(input)`

Derives an account key from a root key.

> [!WARNING]
> The provided derivation path is appended to the base derivation path defined by [CIP-1852](https://cips.cardano.org/cip/CIP-1852#specification) like : `m/1852'/1815'/...accountDerivation'`

**Input:**

```typescript
type DeriveAccountInput = {
  rootKey: Bip32PrivateKey | string; // Root private key
  accountDerivation: number | number[]; // Account index or derivation path
};
```

**Returns:** `Result<DeriveAccountOutput>`

```typescript
type DeriveAccountOutput = {
  rootKey: Bip32PrivateKey; // The parsed root key
  accountKey: Bip32PrivateKey; // The derived account key
};
```

**Example:**

```typescript
import { deriveAccount } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

// Derive account 0
const result = deriveAccount({
  rootKey: process.env.ROOT_KEY,
  accountDerivation: 0,
});

if (isOk(result)) {
  console.log("Account key derived:", result.accountKey.to_hex());
}
```

---

### `derivePrivateKey(input)`

Derives a BIP32 private key from BIP39 entropy (mnemonic seed).

**Input:**

```typescript
type DerivePrivateKeyInput = {
  entropy: Buffer | string; // BIP39 entropy
  password?: Buffer | string; // Optional password for entropy
};
```

**Returns:** `Result<Bip32PrivateKey>`

**Example:**

```typescript
import { derivePrivateKey } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const entropy = process.env.ENTROPY;
const result = derivePrivateKey({ entropy });

if (isOk(result)) {
  console.log("Root key:", result.to_hex());
}
```

---

### `extractKeys(input)`

Extracts payment and stake keys from an account key following CIP-1852.

**Input:**

```typescript
type ExtractKeysInput = {
  accountKey: Bip32PrivateKey | string; // Account key
  paymentDerivation: number | number[]; // Payment key derivation path
  stakeDerivation: number | number[]; // Stake key derivation path
};
```

**Returns:** `Result<ExtractKeysOutput>`

```typescript
type ExtractKeysOutput = {
  accountKey: Bip32PrivateKey; // The parsed account key
  paymentKey: Bip32PrivateKey; // Derived payment key (external chain)
  stakeKey: Bip32PrivateKey; // Derived stake key (staking chain)
};
```

**Example:**

```typescript
import { extractKeys } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const result = extractKeys({
  accountKey, // Hex format account key
  paymentDerivation: 0, // First payment key
  stakeDerivation: 0, // First stake key
});

if (isOk(result)) {
  console.log("Payment key:", result.paymentKey.to_public().to_hex());
  console.log("Stake key:", result.stakeKey.to_public().to_hex());
}
```

---

### `harden(num)`

Converts a derivation index to its hardened equivalent by adding 2^31.

**Parameters:** `num: number` - Derivation index

**Returns:** `number` - Hardened index (num + 0x80000000)

**Example:**

```typescript
import { harden } from "@ada-anvil/vault/csl";

console.log(harden(0)); // 2147483648 (0x80000000)
console.log(harden(1852)); // 2147485500 (0x8000073C)
```

---

### `deriveAddresses(input)`

Derives Cardano addresses from payment and stake keys.

**Input:**

```typescript
type DeriveAddressesInput = {
  paymentKey: Bip32PrivateKey | string; // Payment private key
  stakeKey: Bip32PrivateKey | string; // Stake private key
  network: Network | NetworkId; // "mainnet" | "preprod" | "preview" | 0 | 1
};
```

**Returns:** `Result<DeriveAddressesOutput>`

```typescript
type DeriveAddressesOutput = {
  paymentKey: Bip32PrivateKey; // Parsed payment key
  stakeKey: Bip32PrivateKey; // Parsed stake key
  baseAddress: BaseAddress; // Base address (payment + stake)
  enterpriseAddress: EnterpriseAddress; // Enterprise address (payment only)
  rewardAddress: RewardAddress; // Reward address (stake only)
};
```

**Example:**

```typescript
import { deriveAddresses } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const result = deriveAddresses({
  paymentKey: paymentKeyHex,
  stakeKey: stakeKeyHex,
  network: "preprod",
});

if (isOk(result)) {
  console.log("Base:", result.baseAddress.to_address().to_bech32());
  console.log("Enterprise:", result.enterpriseAddress.to_address().to_bech32());
  console.log("Reward:", result.rewardAddress.to_address().to_bech32());
}
```

---

### `parseAddress(input)`

Parses a Cardano address from various formats (bech32, hex, or CSL object).

**Input:**

```typescript
type ParseAddressInput = {
  address: Address | string | ParsedAddress; // Address to parse
};
```

**Returns:** `Result<ParsedAddress>`

```typescript
type ParsedAddress =
  | BaseAddress
  | EnterpriseAddress
  | PointerAddress
  | RewardAddress;
```

**Example:**

```typescript
import { parseAddress } from "@ada-anvil/vault/csl";
import { BaseAddress } from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { isOk } from "trynot";

const result = parseAddress({
  address: "addr_test1qz...",
});

if (result instanceof BaseAddress) {
  console.log(
    "Payment credential:",
    result.payment_cred().to_keyhash()?.to_hex()
  );
  console.log("Stake credential:", result.stake_cred().to_keyhash()?.to_hex());
}
```

---

### `signTransaction(input)`

Signs a Cardano transaction with one or more private keys.

**Input:**

```typescript
type SignTransactionInput = {
  transaction: Transaction | FixedTransaction | string; //  Transaction to sign (hex-encoded CBOR when string)
  privateKeys: Array<PrivateKey | string>; // Private keys for signing
};
```

**Returns:** `Result<SignTransactionOutput>`

```typescript
type SignTransactionOutput = {
  signedTransaction: FixedTransaction; // Signed transaction
  witnessSet: TransactionWitnessSet; // Witness set with signatures
};
```

**Example:**

```typescript
import { signTransaction } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const result = signTransaction({
  transaction: transactionHex,
  privateKeys: [paymentPrivateKeyHex, stakePrivateKeyHex],
});

if (isOk(result)) {
  console.log("Signed TX:", result.signedTransaction.to_hex());
  console.log("Witness set:", result.witnessSet.to_hex());
}
```

---

### `addRequiredSigner(input)`

Adds a required signer key hash to a transaction.

**Input:**

```typescript
type TransactionInput = Transaction | FixedTransaction | string;
type AddRequiredSignerInput<
  TTransaction extends TransactionInput = TransactionInput
> = {
  transaction: TTransaction; // Transaction to add signer
  keyHash: Ed25519KeyHash | string; // Key hash to add as required signer
};
```

**Returns:** `Result<Transaction | FixedTransaction>` - Returns the same type as input transaction

**Example:**

```typescript
import { addRequiredSigner } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const result = addRequiredSigner({
  transaction: transactionHex,
  keyHash: keyHashHex,
});

if (isOk(result)) {
  console.log("Updated transaction:", result.to_hex());
}
```

---

### `signDataRaw(input)`

Signs arbitrary data with an Ed25519 private key.

**Input:**

```typescript
type SignDataRawInput = {
  data: Buffer | string; // Data to sign (hex string; for UTF-8 text use `Buffer.from(text, "utf8")`)
  privateKey: PrivateKey | string; // Private key for signing
};
```

**Returns:** `Result<SignDataRawOutput>`

```typescript
type SignDataRawOutput = {
  signature: Ed25519Signature;
};
```

**Example:**

```typescript
import { signDataRaw } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const message = Buffer.from("Hello, Cardano!", "utf8");

const result = signDataRaw({
  data: message,
  privateKey: privateKeyHex,
});

if (isOk(result)) {
  console.log("Signature:", result.signature.to_hex());
}
```

---

### `verifySignature(input)`

Verifies an Ed25519 signature against data and public key.

**Input:**

```typescript
type VerifySignatureInput = {
  signature: Ed25519Signature | string; // Signature to verify
  publicKey: PublicKey | string; // Public key
  data: Buffer | string; // Original data that was signed
};
```

**Returns:** `Result<VerifySignatureOutput>`

```typescript
type VerifySignatureOutput = {
  isValid: boolean; // Whether the signature is valid
};
```

**Example:**

```typescript
import { verifySignature } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const result = verifySignature({
  signature: signatureHex,
  publicKey: publicKeyHex,
  data: Buffer.from("Hello, Cardano!", "utf8"),
});

if (isOk(result)) {
  console.log("Signature is valid:", result.isValid);
}
```

---

### `generateEd25519KeyPair()`

Generates a new random Ed25519 key pair.

**Returns:** `Result<GenerateKeyPairOutput>`

```typescript
type GenerateKeyPairOutput = {
  privateKey: PrivateKey; // Generated private key
  publicKey: PublicKey; // Corresponding public key
};
```

**Example:**

```typescript
import { generateEd25519KeyPair } from "@ada-anvil/vault/csl";
import { isOk } from "trynot";

const result = generateEd25519KeyPair();

if (isOk(result)) {
  console.log("Private key:", result.privateKey.to_hex());
  console.log("Public key:", result.publicKey.to_hex());
}
```

---

### `getNetworkId(network)`

Converts network name to network ID.

**Parameters:** `network: Network | NetworkId` - Network name or ID

**Returns:** `NetworkId` (0 for testnet, 1 for mainnet)

**Example:**

```typescript
import { getNetworkId } from "@ada-anvil/vault/csl";

getNetworkId("mainnet"); // 1
getNetworkId("preprod"); // 0
getNetworkId("preview"); // 0
getNetworkId(0); // 0 (pass-through)
getNetworkId(1); // 1 (pass-through)
```

---

## Dependencies

- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Core Cardano serialization library
- **`trynot`**: Result type for error handling

---

## Related Packages

- **[@ada-anvil/vault/vault](../vault/README.md)**: Main vault implementation
- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@ada-anvil/vault/cms](../cms/README.md)**: Message signing utilities
- **[@ada-anvil/vault/utils](../utils/README.md)**: Shared utilities

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
