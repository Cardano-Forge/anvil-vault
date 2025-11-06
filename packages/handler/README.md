# @anvil-vault/handler

Framework-agnostic HTTP request handler builder for Anvil Vault. This package provides a flexible system for creating vault API endpoints that work with any web framework through adapters.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
  - [With Express](#with-express)
  - [With Hono](#with-hono)
- [API Reference](#api-reference)
  - [Handler Builder](#handler-builder)
    - [createVaultHandler](#createvaulthandlerconfig)
    - [handleVaultRequest](#handlevaultrequestcontext-vault-adapter)
  - [Adapter System](#adapter-system)
    - [HandlerAdapter](#handleradaptertparams-tcontext-tresponse)
    - [createHandlerAdapter](#createhandleradapteradapter)
  - [Derivation Utilities](#derivation-utilities)
    - [getDerivation](#getderivationinput-context)
  - [Types](#types)
    - [Derivation](#derivationtcontext)
    - [IVault](#ivault)
    - [VaultConfig](#vaultconfig)
- [REST API Endpoints](#rest-api-endpoints)
- [Error Handling](#error-handling)
- [Creating Custom Adapters](#creating-custom-adapters)
- [Usage with Custom Vault](#usage-with-custom-vault)
- [Security Considerations](#security-considerations)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/handler
```

## Overview

The handler package provides:

- **Framework-Agnostic Design**: Works with Express, Hono, or any custom framework
- **Type-Safe Request Handling**: Full TypeScript support with validated inputs
- **RESTful API Structure**: Standard REST endpoints for wallet operations
- **Built-in Validation**: Schema-based input validation with detailed error messages
- **Flexible Derivation**: Support for unique, constant, pool, and custom derivation strategies
- **Error Handling**: Consistent error responses with proper HTTP status codes

All functions return `Result` types from the `trynot` library for consistent error handling.

## Quick Start

### With Express

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import { Vault } from "@anvil-vault/vault";
import express from "express";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = express();
app.use(express.json());

const handler = createVaultHandler({ vault, adapter: expressAdapter });

// All vault operations are handled through a single endpoint
app.all("/users/:userId/*", handler);

app.listen(3000);
```

### With Hono

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = new Hono();

const handler = createVaultHandler({ vault, adapter: honoAdapter });

app.all("/users/:userId/*", handler);

export default app;
```

## API Reference

- [Handler Builder](#handler-builder)
  - [createVaultHandler](#createvaulthandlerconfig)
  - [handleVaultRequest](#handlevaultrequestcontext-vault-adapter)
- [Adapter System](#adapter-system)
  - [HandlerAdapter](#handleradaptertparams-tcontext-tresponse)
  - [createHandlerAdapter](#createhandleradapteradapter)
- [Derivation Utilities](#derivation-utilities)
  - [getDerivation](#getderivationinput-context)
- [Types](#types)
  - [Derivation](#derivationtcontext)
  - [IVault](#ivault)
  - [VaultConfig](#vaultconfig)

### Handler Builder

#### `createVaultHandler(config)`

Creates a framework-specific request handler for vault operations.

**Parameters:**

- `config.vault: IVault` - Vault instance implementing the IVault interface
- `config.adapter: HandlerAdapter<TParams, TContext, TResponse>` - Framework adapter

**Returns:** Framework-specific handler function

**Example:**

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import { Vault } from "@anvil-vault/vault";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const handler = createVaultHandler({
  vault,
  adapter: expressAdapter,
});

// Use with Express
app.all("/users/:userId/*", handler);
```

---

#### `handleVaultRequest(context, vault, adapter)`

Low-level function for processing vault requests. Used internally by `createVaultHandler`.

**Parameters:**

- `context: TContext` - Framework-specific context object
- `vault: IVault` - Vault instance
- `adapter: HandlerAdapter<TParams, TContext, TResponse>` - Framework adapter

**Returns:** `Promise<Result<{ response: unknown }, VaultError>>`

**Example:**

```typescript
import { handleVaultRequest } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";

const context = await expressAdapter.getContext(req, res);
const result = await handleVaultRequest(context, vault, expressAdapter);
```

---

### Adapter System

#### `HandlerAdapter<TParams, TContext, TResponse>`

Interface for creating framework-specific adapters.

**Type:**

```typescript
type HandlerAdapter<TParams extends AnyParams, TContext, TResponse> = {
  getContext: (...args: TParams) => MaybePromise<TContext>;
  getBody: (context: TContext) => MaybePromise<Record<string, unknown>>;
  getMethod: (context: TContext) => MaybePromise<string>;
  getPath: (context: TContext) => MaybePromise<string>;
  getQuery: (context: TContext) => MaybePromise<Record<string, unknown>>;
  sendResponse: (
    context: TContext,
    result: Result<{ response: unknown }, VaultError>,
  ) => MaybePromise<TResponse>;
};
```

**Methods:**

- `getContext(...args)` - Extract context from framework-specific parameters
- `getBody(context)` - Get request body as object
- `getMethod(context)` - Get HTTP method (GET, POST, etc.)
- `getPath(context)` - Get request path
- `getQuery(context)` - Get query parameters as object
- `sendResponse(context, result)` - Send response to client

---

#### `createHandlerAdapter(adapter)`

Helper function for creating type-safe adapters.

**Parameters:**

- `adapter: HandlerAdapter<TParams, TContext, TResponse>` - Adapter implementation

**Returns:** `HandlerAdapter<TParams, TContext, TResponse>`

**Example:**

```typescript
import { createHandlerAdapter } from "@anvil-vault/handler";
import type { Context } from "hono";

export const honoAdapter = createHandlerAdapter({
  getContext: (c: Context) => c,
  getBody: async (c) => await c.req.json(),
  getMethod: (c) => c.req.method,
  getPath: (c) => c.req.path,
  getQuery: (c) => Object.fromEntries(c.req.queries()),
  sendResponse: (c, result) => {
    if (isErr(result)) {
      return c.json(errorToJson(result), result.statusCode);
    }
    return c.json(result.response);
  },
});
```

---

### Derivation Utilities

#### `getDerivation(input, context?)`

Resolves a derivation strategy into a concrete derivation path.

**Parameters:**

- `input.userId: string` - User identifier (UUID)
- `input.derivation: Derivation<TContext>` - Derivation strategy
- `context?: TContext` - Optional context for custom derivations

**Returns:** `Promise<Result<number | number[]>>`

**Example:**

```typescript
import { getDerivation } from "@anvil-vault/handler";
import { isErr } from "trynot";

// Constant derivation
const constantPath = await getDerivation({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  derivation: { type: "constant", value: 0 },
});
if (!isErr(constantPath)) {
  console.log(constantPath); // 0
}

// Pool derivation
const poolPath = await getDerivation({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  derivation: { type: "pool", size: 10 },
});
if (!isErr(poolPath)) {
  console.log(poolPath); // 0-9 (deterministic based on userId)
}

// Unique derivation
const uniquePath = await getDerivation({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  derivation: { type: "unique" },
});
if (!isErr(uniquePath)) {
  console.log(uniquePath); // [85, 14, 132, 0, ...] (16 bytes from UUID)
}

// Unique with scrambler
const scrambledPath = await getDerivation({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  derivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});
```

---

### Types

#### `Derivation<TContext>`

Defines how to derive keys for a user.

**Type:**

```typescript
type Derivation<TContext = undefined> =
  | {
      type: "unique";
      scrambler?: (
        derivationPath: number[],
        input: { userId: string },
        context: TContext,
      ) => MaybePromise<Result<number[]>>;
    }
  | {
      type: "pool";
      size: number;
    }
  | {
      type: "constant";
      value: number | number[];
    }
  | {
      type: "custom";
      provider: (
        input: { userId: string },
        context: TContext,
      ) => MaybePromise<Result<number | number[] | Derivation<TContext>>>;
    };
```

**Strategies:**

- **`unique`**: Derives a unique path from the user's UUID (16 bytes)
  - Optional `scrambler` function to transform the derivation path
  - Recommended for payment keys to prevent address correlation

- **`pool`**: Distributes users across a fixed pool of keys
  - `size`: Number of keys in the pool
  - Deterministic assignment based on userId
  - Useful for stake keys to consolidate rewards

- **`constant`**: Uses the same derivation for all users
  - `value`: Single index or array of indices
  - Simple but provides no privacy

- **`custom`**: Fully custom derivation logic
  - `provider`: Function that returns derivation path or another Derivation
  - Maximum flexibility for complex requirements

**Example:**

```typescript
import type { Derivation } from "@anvil-vault/handler";

// Unique derivation with scrambling
const paymentDerivation: Derivation = {
  type: "unique",
  scrambler: (path) => path.reverse(),
};

// Pool of 10 stake keys
const stakeDerivation: Derivation = {
  type: "pool",
  size: 10,
};

// Constant account
const accountDerivation: Derivation = {
  type: "constant",
  value: 0,
};

// Custom derivation
const customDerivation: Derivation<{ isPremium: boolean }> = {
  type: "custom",
  provider: async (input, context) => {
    if (context.isPremium) {
      return { type: "constant", value: 0 };
    }
    return { type: "pool", size: 100 };
  },
};
```

---

#### `IVault`

Interface that vault implementations must satisfy.

**Type:**

```typescript
type IVault = {
  getWallet: (input: { userId: string }) => MaybePromise<
    Result<{
      addresses: {
        base: { bech32: string; hex: string };
        enterprise: { bech32: string; hex: string };
        reward: { bech32: string; hex: string };
      };
    }>
  >;
  signData: (input: {
    userId: string;
    payload: string;
    externalAad?: string;
  }) => MaybePromise<
    Result<{
      signature: string;
      key: string;
    }>
  >;
  signTransaction: (input: {
    userId: string;
    transaction: string;
  }) => MaybePromise<
    Result<{
      signedTransaction: string;
      witnessSet: string;
    }>
  >;
};
```

---

#### `VaultConfig`

Configuration for vault instances.

**Type:**

```typescript
type VaultConfig = RequiredVaultConfig & {
  accountDerivation?: Derivation<RequiredVaultConfig>;
  paymentDerivation?: Derivation<RequiredVaultConfig>;
  stakeDerivation?: Derivation<RequiredVaultConfig>;
  customWalletDerivation?: (
    input: { userId: string },
    config: RequiredVaultConfig,
  ) => MaybePromise<Result<DeriveWalletOutput>>;
  additionalWalletDerivation?: (
    keys: DeriveWalletOutput,
    input: { userId: string },
    config: RequiredVaultConfig,
  ) => MaybePromise<Result<DeriveWalletOutput>>;
  ignoreDefaultPaymentDerivationWarning?: boolean;
};

type RequiredVaultConfig = {
  rootKey: () => MaybePromise<Bip32PrivateKey | string>;
  network: Network | NetworkId;
};
```

---

## REST API Endpoints

The handler automatically creates the following REST endpoints:

### `GET /users/:userId/wallet`

Get wallet addresses for a user.

**Path Parameters:**

- `userId: string` - User identifier (UUID)

**Response:**

```json
{
  "addresses": {
    "base": {
      "bech32": "addr1qx...",
      "hex": "00a1b2c3..."
    },
    "enterprise": {
      "bech32": "addr1vx...",
      "hex": "60a1b2c3..."
    },
    "reward": {
      "bech32": "stake1ux...",
      "hex": "e0a1b2c3..."
    }
  }
}
```

**Example:**

```bash
curl http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/wallet
```

---

### `POST /users/:userId/sign-data`

Sign arbitrary data with the user's payment key (CIP-8/CIP-30 compliant).

**Path Parameters:**

- `userId: string` - User identifier (UUID)

**Body:**

```json
{
  "payload": "48656c6c6f2c2043617264616e6f21",
  "externalAad": "optional-hex-string"
}
```

**Response:**

```json
{
  "signature": "845846a201276761646472657373...",
  "key": "a401022001215820..."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/sign-data \
  -H "Content-Type: application/json" \
  -d '{"payload":"48656c6c6f2c2043617264616e6f21"}'
```

---

### `POST /users/:userId/sign-transaction`

Sign a Cardano transaction with the user's payment and stake keys.

**Path Parameters:**

- `userId: string` - User identifier (UUID)

**Body:**

```json
{
  "transaction": "84a500d90102818258200f3abbc8fc19c2e61bab6059bf8a466e6e754833a08a62a6c56fe0e78f19d9d5000181825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc1a10000000021a0002a3010e809fff8080f6"
}
```

**Response:**

```json
{
  "signedTransaction": "84a500d90102818258200f3abbc8fc19c2e61bab6059bf8a466e6e754833a08a62a6c56fe0e78f19d9d5000181825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc1a10000000021a0002a3010e809fff80a10081825820...",
  "witnessSet": "a10081825820..."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/sign-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction":"84a500d90102..."}'
```

---

## Error Handling

All endpoints return consistent error responses:

**Error Response Format:**

```json
{
  "statusCode": 400,
  "error": "Bad request"
}
```

**HTTP Status Codes:**

- `400 Bad Request` - Invalid input (validation failed)
- `404 Not Found` - Invalid path or operation
- `405 Method Not Allowed` - Wrong HTTP method for endpoint
- `500 Internal Server Error` - Vault operation failed

**Example Error Handling:**

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";

const handler = createVaultHandler({ vault, adapter: expressAdapter });

app.all("/users/:userId/*", handler);

// Errors are automatically handled and returned as JSON
// GET /users/invalid-uuid/wallet
// Response: { "statusCode": 400, "error": "Bad request" }
```

---

## Creating Custom Adapters

You can create adapters for any web framework:

```typescript
import { createHandlerAdapter } from "@anvil-vault/handler";
import { errorToJson } from "@anvil-vault/utils";
import { isErr } from "trynot";

// Example: Fastify adapter
export const fastifyAdapter = createHandlerAdapter({
  getContext: (request, reply) => ({ request, reply }),
  getBody: async (ctx) => ctx.request.body || {},
  getMethod: (ctx) => ctx.request.method,
  getPath: (ctx) => ctx.request.url,
  getQuery: (ctx) => ctx.request.query || {},
  sendResponse: (ctx, result) => {
    if (isErr(result)) {
      return ctx.reply
        .status(result.statusCode)
        .send(errorToJson(result));
    }
    return ctx.reply.status(200).send(result.response);
  },
});
```

---

## Usage with Custom Vault

You can implement the `IVault` interface for custom vault logic:

```typescript
import type { IVault } from "@anvil-vault/handler";
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";

class CustomVault implements IVault {
  async getWallet(input: { userId: string }) {
    // Custom wallet derivation logic
    return {
      addresses: {
        base: { bech32: "addr1...", hex: "00..." },
        enterprise: { bech32: "addr1...", hex: "60..." },
        reward: { bech32: "stake1...", hex: "e0..." },
      },
    };
  }

  async signData(input: { userId: string; payload: string; externalAad?: string }) {
    // Custom signing logic
    return {
      signature: "845846a201276761646472657373...",
      key: "a401022001215820...",
    };
  }

  async signTransaction(input: { userId: string; transaction: string }) {
    // Custom transaction signing logic
    return {
      signedTransaction: "84a500d90102...",
      witnessSet: "a10081825820...",
    };
  }
}

const vault = new CustomVault();
const handler = createVaultHandler({ vault, adapter: expressAdapter });
```

---

## Security Considerations

1. **Authentication**: The handler does not include authentication. Implement authentication middleware before the handler:

   ```typescript
   app.use("/users", authMiddleware);
   app.all("/users/:userId/*", handler);
   ```

2. **Authorization**: Verify that the authenticated user matches the `userId` in the path:

   ```typescript
   app.use("/users/:userId/*", (req, res, next) => {
     if (req.user.id !== req.params.userId) {
       return res.status(403).json({ error: "Forbidden" });
     }
     next();
   });
   ```

3. **Rate Limiting**: Implement rate limiting to prevent abuse:

   ```typescript
   import rateLimit from "express-rate-limit";
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   
   app.use("/users", limiter);
   ```

4. **Input Validation**: All inputs are validated using schemas, but ensure your vault implementation also validates data.

5. **HTTPS**: Always use HTTPS in production to protect sensitive data in transit.

---

## Dependencies

- **`@anvil-vault/utils`**: Error handling and validation utilities
- **`trynot`**: Result type and error handling

---

## Related Packages

- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/express](../express/README.md)**: Express.js adapter
- **[@anvil-vault/hono](../hono/README.md)**: Hono adapter
- **[@anvil-vault/utils](../utils/README.md)**: Shared utilities

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/RN4D7wzc">Discord</a>
  |
  <a href="https://x.com/ada_anvil">@ada_anvil</a>
</p>
