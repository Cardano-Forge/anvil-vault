# @ada-anvil/vault/utils

This package provides error handling, validation, parsing, and type utilities.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Functions](#functions)
  - [isBech32Address](#isbech32addressaddress)
  - [parseFromHex](#parsefromhexhexorinstance-hexconstructor)
  - [uuidToByteArray](#uuidtobytearrayuuid)
  - [ValidationError](#validationerror)
  - [stringSchema](#stringschemaopts)
  - [objectSchema](#objectschemarecord)
  - [Schema](#schemat)
  - [ParsedSchema](#parsedschemat)
  - [errorToJson](#errortojsonerror-opts)
  - [errorToString](#errortostringerror-opts)
  - [VaultError](#vaulterror)
  - [MaybePromise](#maybepromiset)
- [Related Packages](#related-packages)

## Functions

### `isBech32Address(address)`

Checks if a string looks like a Cardano bech32-encoded address.

**Parameters:** `address: string` - address to validate

**Returns:** `boolean` - `true` if the address uses bech32 encoding

**Example:**

```typescript
import { isBech32Address } from "@ada-anvil/vault";

// Valid bech32 addresses
isBech32Address("addr1qx..."); // true
isBech32Address("addr_test1qx..."); // true
isBech32Address("stake1ux..."); // true
isBech32Address("stake_test1ux..."); // true

// Invalid addresses
isBech32Address("00a1b2c3..."); // false (hex format)
isBech32Address("addr"); // false (too short)
isBech32Address("invalid"); // false
```

---

### `parseFromHex(hexOrInstance, HexConstructor?)`

Parses a hex string to Buffer or CSL type.

**Overloads:**

```typescript
// Parse to Buffer
function parseFromHex(hexOrInstance: string | Buffer): Result<Buffer>;

// Parse with CSL constructor
function parseFromHex<T>(
  hexOrInstance: string | T,
  HexConstructor: { from_hex: (hex: string) => T }
): Result<T>;

// Handle undefined
function parseFromHex<T>(
  hexOrInstance: string | T | undefined,
  HexConstructor?: { from_hex: (hex: string) => T }
): Result<T | undefined>;
```

**Example:**

```typescript
import { parseFromHex } from "@ada-anvil/vault";
import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs";
import { isOk } from "trynot";

// Parse to Buffer
const buffer = parseFromHex("48656c6c6f");  // Same as `Buffer.from("48656c6c6f", "hex")`
if (isOk(buffer)) {
  console.log(buffer.toString()); // "Hello"
}

// Parse with CSL constructor
const tx = parseFromHex("84a500d90102...", Transaction);
if (isOk(tx)) {
  console.log(tx.to_hex());
}
```

---

### `uuidToByteArray(uuid)`

Converts a UUID string to a byte array.

**Parameters:** `uuid: string` - UUID in standard format (with or without dashes)

**Returns:** `Result<number[]>` - Array of 16 bytes

**Example:**

```typescript
import { uuidToByteArray } from "@ada-anvil/vault";
import { isOk } from "trynot";

const bytes = uuidToByteArray("550e8400-e29b-41d4-a716-446655440000");
if (isOk(bytes)) {
  console.log(bytes); // [85, 14, 132, 0, ...]
  console.log(bytes.length); // 16
}
```

---

### `ValidationError`

Custom error class for validation failures with path tracking.

**Constructor:**

```typescript
new ValidationError(message: string, opts?: { path?: string[] })
```

**Functions:**

`withPath(path: string | string[]): ValidationError` - Add path segments to the error

**Parameters:**

`message: string` - Error message with path

`path: string[]` - Path segments to the invalid field

**Example:**

```typescript
import { ValidationError } from "@ada-anvil/vault";

const error = new ValidationError("Expected a string", {
  path: ["user", "email"],
});
console.log(error.message); // "user.email: Expected a string"

const nestedError = error.withPath("request");
console.log(nestedError.message); // "request.user.email: Expected a string"
```

---

### `stringSchema(opts?)`

Creates a schema for validating string values.

**Parameters:** `opts?: { optional?: boolean }` - Make the string optional

**Returns:** `Schema<string>` or `Schema<string | undefined>`

**Example:**

```typescript
import { stringSchema } from "@ada-anvil/vault";
import { isOk } from "trynot";

const schema = stringSchema();
const result = schema.parse("hello");
if (isOk(result)) {
  console.log(result); // "hello"
}
```

---

### `objectSchema(record)`

Creates a schema for validating objects with typed fields.

**Parameters:** `record: Record<string, Schema>` - Object defining the schema for each field

**Returns:** `Schema<ParsedSchema<T>>` - Schema that validates and types the object

**Example:**

```typescript
import { objectSchema, stringSchema } from "@ada-anvil/vault";
import { isOk } from "trynot";

const userSchema = objectSchema({
  name: stringSchema(),
  email: stringSchema(),
});

const result = userSchema.parse({
  name: "Alice",
  email: "alice@example.com",
});

if (isOk(result)) {
  console.log(result.name); // "Alice"
}
```

---

### `Schema<T>`

Base schema type for validation.

**Type:**

```typescript
type Schema<T> = {
  parse: (value: unknown) => Result<T, ValidationError>;
};
```

---

### `ParsedSchema<T>`

Utility type that extracts the parsed type from a schema.

**Example:**

```typescript
import type { ParsedSchema } from "@ada-anvil/vault";

const schema = objectSchema({
  name: stringSchema(),
  age: stringSchema(),
});

type User = ParsedSchema<typeof schema>;
// { name: string; age: string }
```

---

### `errorToJson(error, opts?)`

Converts any error to a JSON-serializable object with status code.

**Parameters:**

`error: unknown` - The error to convert

`opts?: ErrorToJsonOpts` - Optional configuration

```typescript
type ErrorToJsonOpts = {
  defaultStatusCode?: number; // Default: 500
  defaultError?: string; // Default: "Internal server error"
};
```

**Returns:** `ErrorToJsonOutput`

```typescript
type ErrorToJsonOutput = {
  statusCode: number;
  error: string;
};
```

**Example:**

```typescript
import { errorToJson, VaultError } from "@ada-anvil/vault";

const error = new VaultError({ message: "Invalid input", statusCode: 400 });
const json = errorToJson(error);
console.log(json); // { statusCode: 400, error: "Invalid input" }
```

---

### `errorToString(error, opts?)`

Converts any error to a human-readable string, including nested causes.

**Parameters:**

```typescript
error: unknown // The error to convert
opts?: ErrorToStringOpts // Optional configuration
  // cause?: boolean - Include error causes in output (default: true)
```

**Returns:** `string | undefined` - Error message with causes

**Example:**

```typescript
import { errorToString } from "@ada-anvil/vault";

const error = new Error("Failed to process", {
  cause: new Error("Database connection failed"),
});

const message = errorToString(error);
console.log(message); // "Failed to process: Database connection failed"
```

**Features:**

- Handles nested error causes recursively
- Avoids duplicate messages in cause chains
- Works with string errors and Error objects
- Integrates with `trynot` library for Result types

---

### `VaultError`

Custom error class with HTTP status code support.

**Constructor:**

```typescript
new VaultError({
  message: string, // Error message
  statusCode: number, // HTTP status code
  cause: unknown, // Error cause
});
```

**Example:**

```typescript
import { VaultError } from "@ada-anvil/vault";

throw new VaultError({
  message: "User not found",
  statusCode: 404,
});

throw new VaultError({
  message: "Failed to sign transaction",
  statusCode: 500,
  cause: new Error("Invalid private key"),
});
```

---

### `MaybePromise<T>`

Utility type for values that may or may not be promises.

**Type:**

```typescript
type MaybePromise<T> = T | Promise<T>;
```

**Example:**

```typescript
import type { MaybePromise } from "@ada-anvil/vault";

// Useful for flexible APIs
interface Config {
  getRootKey: () => MaybePromise<string>;
}

const syncConfig: Config = {
  getRootKey: () => "key123",
};

const asyncConfig: Config = {
  getRootKey: async () => {
    const key = await fetchFromDatabase();
    return key;
  },
};
```

---

## Related Packages

- **[@ada-anvil/vault/vault](../vault/README.md)**: Vault implementation
- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@ada-anvil/vault/csl](../csl/README.md)**: Cardano Serialization Library utilities
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
