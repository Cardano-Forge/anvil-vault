# @ada-anvil/vault/vault

Core package of Anvil Vault.

All functions return `Result` types from `trynot` for type-safe error handling. See [Error Handling](../framework/README.md#error-handling) for details.

## Table of Contents

- [Usage](#usage)
- [Vault Class](#vault-class)
- [Derivation Strategies](#derivation-strategies)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Usage

> [!WARNING]
> Never hardcode the root key. Use secure key management for production.

```typescript
import { Vault } from "@ada-anvil/vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod", // "preprod", "mainnet", "preview"
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});
```

---

### `Vault` Class

#### VaultConfig

```typescript
type VaultConfig = {
  rootKey: () => Promise<Bip32PrivateKey | string>; // Function returning the root private key (hex)
  network: Network | NetworkId; // "mainnet" | "preprod" | "preview" | 0 | 1
  accountDerivation?: Derivation<RequiredVaultConfig>; // Account derivation strategy (default: constant 0)
  paymentDerivation?: Derivation<RequiredVaultConfig>; // Payment key derivation strategy (default: unique reversed)
  stakeDerivation?: Derivation<RequiredVaultConfig>; // Stake key derivation strategy (default: pool of 10)
  customWalletDerivation?: CustomDerivation; // Override default wallet derivation
  additionalWalletDerivation?: AdditonalDerivation; // Modify derived keys
  ignoreDefaultPaymentDerivationWarning?: boolean; // Suppress warning for default payment derivation
};
```

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: async () => {
    // Fetch from secure storage
    return await getSecureRootKey();
  },
  network: "preprod",
  accountDerivation: {
    type: "constant",
    value: 0,
  },
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
  stakeDerivation: {
    type: "pool",
    size: 100,
  },
});
```

---

#### `vault.getWallet(input)`

Retrieves wallet addresses for a user.

**Parameters:**

```typescript
type Input = { userId: string }; // User identifier
```

**Returns:** `Promise<Result<GetWalletOutput>>`

```typescript
type GetWalletOutput = {
  addresses: {
    base: { bech32: string; hex: string };
    enterprise: { bech32: string; hex: string };
    reward: { bech32: string; hex: string };
  };
};
```

**Example:**

```typescript
import { Vault } from "@ada-anvil/vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const result = await vault.getWallet({ userId: "user123" });

if (isOk(result)) {
  console.log("Base address:", result.addresses.base.bech32);
  console.log("Enterprise address:", result.addresses.enterprise.bech32);
  console.log("Reward address:", result.addresses.reward.bech32);
  // Addresses are available in both formats
  console.log("Base hex:", result.addresses.base.hex);
}
```

---

#### `vault.signData(input)`

Signs arbitrary data using CIP-8/CIP-30 standards.

**Parameters:**

```typescript
type Input = {
  userId: string; // User identifier
  payload: string; // Data to sign
  externalAad?: string; // Optional external Additional Authenticated Data
};
```

**Returns:** `Promise<Result<SignDataOutput>>`

```typescript
type SignDataOutput = {
  signature: string; // COSE Sign1 hex
  key: string; // COSE Key hex
};
```

**Example:**

```typescript
import { Vault } from "@ada-anvil/vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const result = await vault.signData({
  userId: "user123",
  payload: Buffer.from("Verify my identity", "utf8"),
});

if (isOk(result)) {
  console.log("Signature:", result.signature);
  console.log("Public key:", result.key);
}

// With external AAD
const resultWithAad = await vault.signData({
  userId: "user123",
  payload: "Transaction data",
  externalAad: "Additional context",
});
```

---

#### `vault.signTransaction(input)`

Signs a Cardano transaction with the user's payment key.

**Parameters:**

```typescript
type Input = {
  userId: string; // User identifier
  transaction: string | Transaction | FixedTransaction; // Transaction to sign
};
```

**Returns:** `Promise<Result<SignTransactionOutput>>`

```typescript
type SignTransactionOutput = {
  signedTransaction: string; // Signed transaction hex
  witnessSet: string; // Witness set hex
};
```

**Example:**

```typescript
import { Vault } from "@ada-anvil/vault/vault";
import { isOk } from "trynot";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const txHex = "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667...";

const result = await vault.signTransaction({
  userId: "user123",
  transaction: txHex,
});

if (isOk(result)) {
  console.log("Signed transaction:", result.signedTransaction);
  console.log("Witness set:", result.witnessSet);
}
```

---

#### `vault.set(key, value)`

Modifies the vault configuration in place and returns the same instance.

**Parameters:**

- `key: keyof VaultConfig` - Configuration key to modify
- `value: VaultConfig[key]` - New value

**Returns:** `this` (same Vault instance)

**Example:**

```typescript
import { Vault } from "@ada-anvil/vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod",
});

// Modify in place
vault.set("network", "mainnet");
console.log(vault.config.network); // "mainnet"
```

---

#### `vault.with(key, value)`

Creates a new Vault instance with modified configuration.

**Parameters:**

- `key: keyof VaultConfig` - Configuration key to modify
- `value: VaultConfig[key]` - New value

**Returns:** `Vault` (new instance)

**Example:**

```typescript
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod",
});

// Create new instance
const mainnetVault = vault.with("network", "mainnet");

console.log(vault.config.network); // "preprod" (unchanged)
console.log(mainnetVault.config.network); // "mainnet"
```

---

## Derivation Strategies

Choose the right derivation strategy for your use case:

### Strategy Comparison

| Strategy     | Use Case                  | Security | Example                          |
| ------------ | ------------------------- | -------- | -------------------------------- |
| **Constant** | Testing, single account   | Low      | All users share account 0        |
| **Unique**   | Production payment keys   | High     | Each user gets unique address    |
| **Pool**     | Stake keys for delegation | Medium   | Share 10 stake keys across users |
| **Custom**   | Complex business logic    | Varies   | Database-driven derivation       |

### Default Behavior

If not specified, the vault uses:

- **Account**: Constant (0)
- **Payment**: Unique with reversed path (Not recommended for production)
- **Stake**: Pool of 10 keys

> [!WARNING]
> Always provide custom payment derivation for production.

### User ID Security

Use non-guessable user identifiers:

```typescript
// Good: UUID
const userId = "550e8400-e29b-41d4-a716-446655440000";

// Bad: Sequential integers
// const userId = "1", "2", "3"...
```

## Dependencies

- **`@emurgo/cardano-message-signing-nodejs-gc`**: COSE signing implementation
- **`@emurgo/cardano-serialization-lib-nodejs-gc`**: Cardano cryptography
- **`trynot`**: Result type for error handling

## Related Packages

- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@ada-anvil/vault/express](../express/README.md)**: Express adapter
- **[@ada-anvil/vault/hono](../hono/README.md)**: Hono adapter
- **[@ada-anvil/vault/csl](../csl/README.md)**: Cardano Serialization Library utilities
- **[@ada-anvil/vault/cms](../cms/README.md)**: Message signing utilities
- **[@ada-anvil/vault/bip39](../bip39/README.md)**: BIP-39 mnemonic utilities

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
