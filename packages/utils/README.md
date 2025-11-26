# @anvil-vault/utils

Shared utility functions and types for the Anvil Vault ecosystem. This package provides error handling, validation, parsing, and type utilities used across all Anvil Vault packages.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Cardano Utilities](#cardano-utilities)
    - [isBech32Address](#isbech32addressaddress)
  - [Parsing Utilities](#parsing-utilities)
    - [parseFromHex](#parsefromhexhexorinstance-hexconstructor)
    - [uuidToByteArray](#uuidtobytearrayuuid)
  - [Validation](#validation)
    - [ValidationError](#validationerror)
    - [stringSchema](#stringschemaopts)
    - [objectSchema](#objectschemarecord)
    - [Schema](#schemat)
    - [ParsedSchema](#parsedschemat)
  - [Error Handling](#error-handling)
    - [errorToJson](#errortojsonerror-opts)
    - [errorToString](#errortostringerror-opts)
    - [VaultError](#vaulterror)
  - [Type Utilities](#type-utilities)
    - [MaybePromise](#maybepromiset)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/utils
```

## Overview

The utils package includes:

- **Cardano Utilities**: Bech32 address validation
- **Parsing**: Hex and UUID parsing utilities
- **Validation**: Schema-based validation with detailed error messages
- **Error Handling**: Utilities for converting errors to JSON and strings
- **Type Utilities**: TypeScript helper types

## Quick Start

```typescript
import {
  errorToJson,
  VaultError,
  stringSchema,
  parseFromHex,
} from "@anvil-vault/utils";
import { isOk } from "trynot";

// Parsing
const buffer = parseFromHex("48656c6c6f");
if (isOk(buffer)) {
  console.log(buffer.toString()); // "Hello"
}

// Validation
const schema = stringSchema();
const result = schema.parse("hello");
if (isOk(result)) {
  console.log(result); // "hello"
}

// Error handling
const error = new VaultError({ message: "Invalid input", statusCode: 400 });
const json = errorToJson(error);
// { statusCode: 400, error: "Invalid input" }
```

## API Reference

### Cardano Utilities

#### `isBech32Address(address)`

Checks if a string is a Cardano bech32-encoded address.

**Parameters:**

- `address: string` - The address string to check

**Returns:** `boolean` - True if the address uses bech32 encoding

**Example:**

```typescript
import { isBech32Address } from "@anvil-vault/utils";

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

### Parsing Utilities

#### `parseFromHex(hexOrInstance, HexConstructor?)`

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
import { parseFromHex } from "@anvil-vault/utils";
import { Transaction } from "@emurgo/cardano-serialization-lib-nodejs";
import { isOk } from "trynot";

// Parse to Buffer
const buffer = parseFromHex("48656c6c6f");
if (isOk(buffer)) {
  console.log(buffer.toString()); // "Hello"
}

// Parse with CSL constructor
const tx = parseFromHex("84a500d90102...", Transaction);
if (isOk(tx)) {
  console.log(tx.to_hex());
}
```

#### `uuidToByteArray(uuid)`

Converts a UUID string to a byte array.

**Parameters:**

- `uuid: string` - UUID in standard format (with or without dashes)

**Returns:** `Result<number[]>` - Array of 16 bytes

**Example:**

```typescript
import { uuidToByteArray } from "@anvil-vault/utils";
import { isOk } from "trynot";

const bytes = uuidToByteArray("550e8400-e29b-41d4-a716-446655440000");
if (isOk(bytes)) {
  console.log(bytes); // [0x55, 0x0e, 0x84, 0x00, ...]
  console.log(bytes.length); // 16
}
```

---

### Validation

#### `ValidationError`

Custom error class for validation failures with path tracking.

**Constructor:**

```typescript
new ValidationError(message: string, opts?: { path?: string[] })
```

**Functions:**

- `withPath(path: string | string[]): ValidationError` - Add path segments to the error

**Properties:**

- `message: string` - Error message with path
- `path: string[]` - Path segments to the invalid field

**Example:**

```typescript
import { ValidationError } from "@anvil-vault/utils";

const error = new ValidationError("Expected a string", {
  path: ["user", "email"],
});
console.log(error.message); // "user.email: Expected a string"

const nestedError = error.withPath("request");
console.log(nestedError.message); // "request.user.email: Expected a string"
```

#### `stringSchema(opts?)`

Creates a schema for validating string values.

**Parameters:**

- `opts?: { optional?: boolean }` - Make the string optional

**Returns:** `Schema<string>` or `Schema<string | undefined>`

**Example:**

```typescript
import { stringSchema } from "@anvil-vault/utils";
import { isOk } from "trynot";

const schema = stringSchema();
const result = schema.parse("hello");
if (isOk(result)) {
  console.log(result); // "hello"
}
```

#### `objectSchema(record)`

Creates a schema for validating objects with typed fields.

**Parameters:**

- `record: Record<string, Schema>` - Object defining the schema for each field

**Returns:** `Schema<ParsedSchema<T>>` - Schema that validates and types the object

**Example:**

```typescript
import { objectSchema, stringSchema } from "@anvil-vault/utils";
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
  console.log(result.name); // "Alice" (fully typed)
}
```

#### `Schema<T>`

Base schema type for validation.

**Type:**

```typescript
type Schema<T> = {
  parse: (value: unknown) => Result<T, ValidationError>;
};
```

#### `ParsedSchema<T>`

Utility type that extracts the parsed type from a schema.

**Example:**

```typescript
import type { ParsedSchema } from "@anvil-vault/utils";

const schema = objectSchema({
  name: stringSchema(),
  age: stringSchema(),
});

type User = ParsedSchema<typeof schema>;
// { name: string; age: string }
```

---

### Error Handling

#### `errorToJson(error, opts?)`

Converts any error to a JSON-serializable object with status code.

**Parameters:**

- `error: unknown` - The error to convert
- `opts?: ErrorToJsonOpts` - Optional configuration
  - `defaultStatusCode?: number` - Status code for non-VaultError errors (default: 500)
  - `defaultError?: string` - Fallback error message (default: "Internal server error")

**Returns:** `ErrorToJsonOutput`

- `statusCode: number` - HTTP status code
- `error: string` - Error message

**Example:**

```typescript
import { errorToJson, VaultError } from "@anvil-vault/utils";

const error = new VaultError({ message: "Invalid input", statusCode: 400 });
const json = errorToJson(error);
// { statusCode: 400, error: "Invalid input" }
```

#### `errorToString(error, opts?)`

Converts any error to a human-readable string, including nested causes.

**Parameters:**

- `error: unknown` - The error to convert
- `opts?: ErrorToStringOpts` - Optional configuration
  - `cause?: boolean` - Include error causes in output (default: true)

**Returns:** `string | undefined` - Error message with causes

**Example:**

```typescript
import { errorToString } from "@anvil-vault/utils";

const error = new Error("Failed to process", {
  cause: new Error("Database connection failed"),
});

const message = errorToString(error);
// "Failed to process: Database connection failed"
```

**Features:**

- Handles nested error causes recursively
- Avoids duplicate messages in cause chains
- Works with string errors and Error objects
- Integrates with `trynot` library for Result types

#### `VaultError`

Custom error class with HTTP status code support.

**Constructor:**

```typescript
new VaultError({
  message: string,
  statusCode: number,
  cause: unknown,
});
```

**Properties:**

- `message: string` - Error message
- `statusCode: number` - HTTP status code
- `name: "VaultError"` - Error name

**Example:**

```typescript
import { VaultError } from "@anvil-vault/utils";

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

### Type Utilities

#### `MaybePromise<T>`

Utility type for values that may or may not be promises.

**Type:**

```typescript
type MaybePromise<T> = T | Promise<T>;
```

**Example:**

```typescript
import type { MaybePromise } from "@anvil-vault/utils";

function processValue(value: MaybePromise<string>): Promise<string> {
  return Promise.resolve(value);
}

// Both work
processValue("hello");
processValue(Promise.resolve("hello"));

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

## Dependencies

- **`trynot`**: Result type and error handling utilities

---

## Related Packages

- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/csl](../csl/README.md)**: Cardano Serialization Library utilities
- **[@anvil-vault/bip39](../bip39/README.md)**: BIP-39 mnemonic utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord Invite</a>
  |
  <a href="https://x.com/AnvilDevAgency">X: @AnvilDevAgency</a>
</p>
