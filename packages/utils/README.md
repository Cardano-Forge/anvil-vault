# @anvil-vault/utils

Shared utility functions and types for the Anvil Vault ecosystem. This package provides error handling, validation, parsing, and type utilities used across all Anvil Vault packages.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Functions](#functions)
  - [Error Handling](#error-handling)
    - [errorToJson](#errortojsonerror-opts)
    - [errorToString](#errortostringerror-opts)
    - [VaultError](#vaulterror)
  - [Validation](#validation)
    - [ValidationError](#validationerror)
    - [stringSchema](#stringschemaopts)
    - [objectSchema](#objectschemarecord)
    - [Schema](#schemat)
    - [ParsedSchema](#parsedschemat)
  - [Parsing Utilities](#parsing-utilities)
    - [parseFromHex](#parsefromhexhexorinstance-hexconstructor)
    - [uuidToByteArray](#uuidtobytearrayuuid)
  - [Cardano Utilities](#cardano-utilities)
    - [isBech32Address](#isbech32addressaddress)
  - [Type Utilities](#type-utilities)
    - [MaybePromise](#maybepromiset)
- [Error Handling Pattern](#error-handling-pattern)
- [Usage in Anvil Vault](#usage-in-anvil-vault)
- [Dependencies](#dependencies)

## Installation

```bash
npm install @anvil-vault/utils
```

## Overview

The utils package includes:

- **Error Handling**: Utilities for converting errors to JSON and strings
- **Validation**: Schema-based validation with detailed error messages
- **Parsing**: Hex and UUID parsing utilities
- **Type Utilities**: TypeScript helper types
- **Cardano Utilities**: Bech32 address validation

All functions return `Result` types from the `trynot` library for consistent error handling.

## API Reference

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

try {
  throw new VaultError({ message: "Invalid input", statusCode: 400 });
} catch (error) {
  const json = errorToJson(error);
  // { statusCode: 400, error: "Invalid input" }
}

// With custom defaults
const json = errorToJson(new Error("Something went wrong"), {
  defaultStatusCode: 503,
  defaultError: "Service unavailable"
});
// { statusCode: 503, error: "Something went wrong" }
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
  cause: new Error("Database connection failed")
});

const message = errorToString(error);
// "Failed to process: Database connection failed"

// Without causes
const messageNoCause = errorToString(error, { cause: false });
// "Failed to process"
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
  cause?: unknown
})
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
  statusCode: 404
});

throw new VaultError({
  message: "Failed to sign transaction",
  statusCode: 500,
  cause: new Error("Invalid private key")
});
```

### Validation

#### `ValidationError`

Custom error class for validation failures with path tracking.

**Constructor:**

```typescript
new ValidationError(message: string, opts?: { path?: string[] })
```

**Methods:**

- `withPath(path: string | string[]): ValidationError` - Add path segments to the error

**Properties:**

- `message: string` - Error message with path (e.g., "user.email: Expected a string")
- `path: string[]` - Path segments to the invalid field

**Example:**

```typescript
import { ValidationError } from "@anvil-vault/utils";

const error = new ValidationError("Expected a string", { path: ["user", "email"] });
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
import { isErr } from "trynot";

const schema = stringSchema();
const result = schema.parse("hello");
if (!isErr(result)) {
  console.log(result); // "hello"
}

const optionalSchema = stringSchema({ optional: true });
const undefinedResult = optionalSchema.parse(undefined);
if (!isErr(undefinedResult)) {
  console.log(undefinedResult); // undefined
}

const invalidResult = schema.parse(123);
if (isErr(invalidResult)) {
  console.log(invalidResult.message); // "Expected a string, received number"
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
import { isErr } from "trynot";

const userSchema = objectSchema({
  name: stringSchema(),
  email: stringSchema(),
  bio: stringSchema({ optional: true })
});

const result = userSchema.parse({
  name: "Alice",
  email: "alice@example.com"
});

if (!isErr(result)) {
  console.log(result.name); // "Alice" (fully typed)
  console.log(result.bio);  // undefined
}

const invalidResult = userSchema.parse({
  name: "Bob",
  email: 123 // Invalid type
});

if (isErr(invalidResult)) {
  console.log(invalidResult.message); // "email: Expected a string, received number"
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
  age: stringSchema()
});

type User = ParsedSchema<typeof schema>;
// { name: string; age: string }
```

### Parsing Utilities

#### `parseFromHex(hexOrInstance, HexConstructor?)`

Parses a hex string or returns the instance if already parsed. Works with Cardano Serialization Library types.

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
import { isErr } from "trynot";

// Parse to Buffer
const buffer = parseFromHex("48656c6c6f");
if (!isErr(buffer)) {
  console.log(buffer.toString()); // "Hello"
}

// Parse with CSL constructor
const txHex = "84a500d90102...";
const tx = parseFromHex(txHex, Transaction);
if (!isErr(tx)) {
  console.log(tx.to_hex());
}

// Already parsed - returns as-is
const existingTx = Transaction.from_hex(txHex);
const result = parseFromHex(existingTx, Transaction);
if (!isErr(result)) {
  console.log(result === existingTx); // true
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
import { isErr } from "trynot";

const bytes = uuidToByteArray("550e8400-e29b-41d4-a716-446655440000");
if (!isErr(bytes)) {
  console.log(bytes); // [0x55, 0x0e, 0x84, 0x00, ...]
  console.log(bytes.length); // 16
}

// Works without dashes
const bytes2 = uuidToByteArray("550e8400e29b41d4a716446655440000");

// Works with uppercase
const bytes3 = uuidToByteArray("550E8400-E29B-41D4-A716-446655440000");

// Invalid UUID
const invalid = uuidToByteArray("not-a-uuid");
if (isErr(invalid)) {
  console.log(invalid.message); // "Invalid UUID"
}
```

**Features:**

- Accepts UUIDs with or without dashes
- Case-insensitive
- Returns error for invalid UUIDs
- Validates hex characters

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

**Supported Prefixes:**

- `addr` - Payment addresses (mainnet)
- `addr_test` - Payment addresses (testnet)
- `stake` - Stake addresses (mainnet)
- `stake_test` - Stake addresses (testnet)

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
  getRootKey: () => "key123"
};

const asyncConfig: Config = {
  getRootKey: async () => {
    const key = await fetchFromDatabase();
    return key;
  }
};
```

## Error Handling Pattern

All parsing and validation functions use the `trynot` library's `Result` type:

```typescript
import { isErr, isOk, unwrap } from "trynot";
import { parseFromHex } from "@anvil-vault/utils";

// Check for errors
const result = parseFromHex("48656c6c6f");
if (isErr(result)) {
  console.error("Failed to parse:", result.message);
  return;
}

// Use the value
console.log(result.toString());

// Or unwrap (throws on error)
const buffer = unwrap(parseFromHex("48656c6c6f"));
```

## Usage in Anvil Vault

These utilities are used throughout the Anvil Vault packages:

- **`@anvil-vault/vault`**: Uses validation schemas for configuration
- **`@anvil-vault/handler`**: Uses error conversion for HTTP responses
- **`@anvil-vault/csl`**: Uses `parseFromHex` for CSL type conversion
- **`@anvil-vault/bip39`**: Uses `uuidToByteArray` for entropy generation

## Dependencies

- **`trynot`**: Result type and error handling utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord</a>
  |
  <a href="https://x.com/AnvilDevAgency">@ada_anvil</a>
</p>
