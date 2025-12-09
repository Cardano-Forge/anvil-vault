# @ada-anvil/vault/handler

Framework-agnostic HTTP request handler builder for Anvil Vault. This package provides a flexible system for creating vault API endpoints that work with any web framework through adapters.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Quick Start](#quick-start)
  - [With Express](#with-express)
  - [With Hono](#with-hono)
- [Functions](#functions)
  - [createVaultHandler](#createvaulthandlerconfig)
  - [handleVaultRequest](#handlevaultrequestcontext-vault-adapter)
  - [HandlerAdapter](#handleradaptertparams-tcontext-tresponse)
  - [createHandlerAdapter](#createhandleradapteradapter)
  - [getDerivation](#getderivationinput-context)
  - [Types](#types)
    - [Derivation](#derivationtcontext)
    - [IVault](#ivault)
    - [VaultConfig](#vaultconfig)
- [REST API Endpoints](#rest-api-endpoints)
- [HTTP Error Responses](#http-error-responses)
- [Related Packages](#related-packages)

---

## Quick Start

### With Express

See the [Express Quick Start](../express/README.md#usage) for a complete example.

### With Hono

See the [Hono Quick Start](../hono/README.md#usage) for a complete example.

---

## Functions

### `createVaultHandler(config)`

Creates a framework-specific request handler for vault operations.

> [!WARNING]
> The handler does not provide any form of authentication

**Input:**

```typescript
type CreateVaultHandlerConfig<
  TParams extends AnyParams,
  TContext,
  TResponse
> = {
  vault: IVault; // Vault instance implementing the IVault interface
  adapter: HandlerAdapter<TParams, TContext, TResponse>; // Framework adapter
};
```

**Returns:** Framework-specific handler function

**Example:**

```typescript
import { createVaultHandler } from "@ada-anvil/vault";
import { expressAdapter } from "@ada-anvil/vault/express";

app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);
```

---

### `handleVaultRequest(context, vault, adapter)`

Low-level function for processing vault requests. Used internally by `createVaultHandler`.

```typescript
function handleVaultRequest<TParams extends AnyParams, TContext, TResponse>(
  context: TContext,
  vault: IVault,
  adapter: HandlerAdapter<TParams, TContext, TResponse>
): Promise<Result<{ response: unknown }, VaultError>>;
```

**Parameters:**

- `context: TContext` - Framework-specific context object
- `vault: IVault` - Vault instance
- `adapter: HandlerAdapter<TParams, TContext, TResponse>` - Framework adapter

**Returns:** `Promise<Result<{ response: unknown }, VaultError>>`

**Example:**

```typescript
import { handleVaultRequest } from "@ada-anvil/vault";
import { expressAdapter } from "@ada-anvil/vault/express";

const context = await expressAdapter.getContext(req, res);
const result = await handleVaultRequest(context, vault, expressAdapter);
```

---

### `HandlerAdapter<TParams, TContext, TResponse>`

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
    result: Result<{ response: unknown }, VaultError>
  ) => MaybePromise<TResponse>;
};
```

---

### `createHandlerAdapter(adapter)`

Helper function for creating type-safe adapters.

**Parameters:** `adapter: HandlerAdapter<TParams, TContext, TResponse>` - Adapter implementation

**Returns:** `HandlerAdapter<TParams, TContext, TResponse>`

**Example:**

```typescript
import { createHandlerAdapter } from "@ada-anvil/vault";

export const customAdapter = createHandlerAdapter({
  getContext: (req, res) => ({ req, res }),
  getBody: async (ctx) => ctx.req.body,
  getMethod: (ctx) => ctx.req.method,
  getPath: (ctx) => ctx.req.path,
  getQuery: (ctx) => ctx.req.query,
  sendResponse: (ctx, result) => {
    if (isErr(result)) {
      return ctx.res.status(result.statusCode).json(errorToJson(result));
    }
    return ctx.res.json(result.response);
  },
});
```

---

### `getDerivation(input, context?)`

Resolves a derivation strategy into a concrete derivation path.

**Parameters:**

```typescript
type GetDerivationInput<TContext = undefined> = {
  userId: string; // User identifier (UUID)
  derivation: Derivation<TContext>; //  Derivation strategy
};

type Params = {
  input: GetDerivationInput;
  context?: TContext; // Optional context for custom derivations
};
```

**Returns:** `Promise<Result<number | number[]>>`

**Example:**

```typescript
import { getDerivation } from "@ada-anvil/vault";
import { isOk } from "trynot";

const result = await getDerivation({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  derivation: { type: "unique" },
});

if (isOk(result)) {
  console.log(result); // [85, 14, 132, 0, ...] (16 bytes from UUID)
}
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
        context: TContext
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
        context: TContext
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

// Unique with scrambling
const paymentDerivation: Derivation = {
  type: "unique",
  scrambler: (path) => path.reverse(),
};

// Pool of 10 keys
const stakeDerivation: Derivation = {
  type: "pool",
  size: 10,
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
    config: RequiredVaultConfig
  ) => MaybePromise<Result<DeriveWalletOutput>>;
  additionalWalletDerivation?: (
    keys: DeriveWalletOutput,
    input: { userId: string },
    config: RequiredVaultConfig
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
  "transaction": "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6"
}
```

**Response:**

```json
{
  "signedTransaction": "84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6",
  "witnessSet": "a100d9010281825820a841677b40416b65c59be000e4fa10c7a48f96da053bb1b75722e3a8249b7b355840b2e42cb89b8c56b9615c71461bb1e545a0084699be22aa22085a86ba28162dfe268d4407f82310d2cca6721b616a4af96aa6c6cff4a9124ef8acd2dbe80b2f00"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/sign-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction":"84a500d90102818258203b1663796602c0d84b03c0f201c4ed3a76667e1e05698c2aee7168ab327eb6de0001818258390048dc188cd7a3fa245498144a5469c34ea11c54975587529269430016a2b990e0c40026e9e9381abdb18ba9f4bf80bd65f7c19263357f6497821b0000000403b4a354a4581c698a6ea0ca99f315034072af31eaac6ec11fe8558d3f48e9775aab9da14574445249501823581cb784ba558baab378e670b8285f8c079ef002b5a0eb26fd6a533a5611a14d4d79436f6f6c4173736574233101581cc82a4452eaebccb82aced501b3c94d3662cf6cd2915ad7148b459aeca14341584f1a000d66b7581cf0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9aa14d000de140646f64696c616e6e6501021a0002f43d031a05e2d418081a05e2b7f8a0f5f6"}'
```

---

## HTTP Error Responses

All endpoints return consistent JSON error responses:

```json
{
  "statusCode": 400,
  "error": "Bad request"
}
```

**Status Codes:**

- `400` - Invalid input (validation failed)
- `404` - Invalid path or operation
- `405` - Wrong HTTP method
- `500` - Vault operation failed

For general error handling patterns, see [Error Handling](../framework/README.md#error-handling).

---

## Related Packages

- **[@ada-anvil/vault/vault](../vault/README.md)**: Main vault implementation
- **[@ada-anvil/vault/express](../express/README.md)**: Express.js adapter
- **[@ada-anvil/vault/hono](../hono/README.md)**: Hono adapter
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
