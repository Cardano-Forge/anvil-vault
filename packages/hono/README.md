# @anvil-vault/hono

Hono adapter for Anvil Vault handlers. This package provides seamless integration between Anvil Vault and Hono applications.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [honoAdapter](#honoadapter)
  - [HonoAdapter](#honoadaptertenv)
- [API Endpoints](#api-endpoints)
- [Advanced Usage](#advanced-usage)
  - [Custom Path Mapping](#custom-path-mapping)
  - [Multiple Vault Instances](#multiple-vault-instances)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/hono
```

## Overview

The Hono adapter implements the `HandlerAdapter` interface from `@anvil-vault/handler`, allowing you to use Anvil Vault with Hono applications.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Quick Start

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod",
});

const app = new Hono();

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

export default app;
```

## API Reference

### `honoAdapter`

The main adapter instance that implements the `HandlerAdapter` interface.

**Type:** `HonoAdapter`

**Functions:**

- `getContext(c)` - Returns the Hono context object
- `getBody(context)` - Returns parsed JSON body from `c.req.json()`
- `getMethod(context)` - Returns HTTP method from `c.req.method`
- `getPath(context)` - Returns request path from `c.req.path`
- `getQuery(context)` - Returns query parameters from `c.req.query()`
- `sendResponse(context, result)` - Returns JSON response with appropriate status code

**Example:**

```typescript
import { honoAdapter } from "@anvil-vault/hono";
import { createVaultHandler } from "@anvil-vault/handler";

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);
```

---

### `HonoAdapter<TEnv>`

TypeScript type for the Hono adapter with optional environment typing.

**Type:**

```typescript
type HonoAdapter<TEnv extends Env = Env> = HandlerAdapter<
  [c: Context<TEnv>],
  Context,
  Response
>;
```

**Generic Parameters:**

- `TEnv`: Hono environment type (default: `Env`)
- `TParams`: `[c: Context<TEnv>]` - Hono route handler parameters
- `TContext`: `Context` - Hono context object
- `TResponse`: `Response` - Web standard Response object

---

## API Endpoints

When using the Hono adapter with `createVaultHandler`, the following endpoints are automatically available:

### `GET /users/:userId/wallet`

Get wallet addresses for a user.

```bash
curl http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/wallet
```

### `POST /users/:userId/sign-data`

Sign arbitrary data (CIP-8/CIP-30 compliant).

```bash
curl -X POST http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/sign-data \
  -H "Content-Type: application/json" \
  -d '{"payload":"48656c6c6f2c2043617264616e6f21"}'
```

### `POST /users/:userId/sign-transaction`

Sign a Cardano transaction.

```bash
curl -X POST http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/sign-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction":"84a500d90102..."}'
```

See the [@anvil-vault/handler documentation](../handler/README.md#rest-api-endpoints) for detailed endpoint specifications.

---

## Advanced Usage

### Custom Path Mapping

Map `/users/me` to the actual user ID:

```typescript
const userId = "f3aa7d40-58c2-44df-ba49-d4026c822571"; // example

app.use(
  createVaultHandler({
    vault,
    adapter: {
      ...honoAdapter,
      getPath: (ctx) => ctx.req.path.replace("/users/me", `/users/${userId}`),
    },
  })
);
```

### Multiple Vault Instances

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

const mainnetVault = new Vault({
  rootKey: () => process.env.MAINNET_ROOT_KEY,
  network: "mainnet",
});

const testnetVault = new Vault({
  rootKey: () => process.env.TESTNET_ROOT_KEY,
  network: "preprod",
});

const app = new Hono();

app.use(
  "/mainnet",
  createVaultHandler({
    vault: mainnetVault,
    adapter: honoAdapter,
  })
);

app.use(
  "/testnet",
  createVaultHandler({
    vault: testnetVault,
    adapter: honoAdapter,
  })
);

export default app;
```

---

## Dependencies

- **`@anvil-vault/handler`**: Handler adapter interface
- **`@anvil-vault/utils`**: Error handling utilities
- **`trynot`**: Result type and error handling
- **`hono`**: Hono web framework (peer dependency)

---

## Related Packages

- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil Website</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord Invite</a>
  |
  <a href="https://x.com/AnvilDevAgency">X: @AnvilDevAgency</a>
</p>
