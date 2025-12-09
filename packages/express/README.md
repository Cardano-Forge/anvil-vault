# @ada-anvil/vault/express

This package provides seamless integration between Anvil Vault and Express.js applications.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [expressAdapter](#expressadapter)
- [API Endpoints](#api-endpoints)
- [Requirements](#requirements)
- [Advanced Usage](#advanced-usage)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Overview

The Express adapter implements the `HandlerAdapter` interface from `@ada-anvil/vault`, allowing you to use Anvil Vault with Express.js applications.

All functions return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

## Quick Start

```typescript
import { createVaultHandler } from "@ada-anvil/vault";
import { expressAdapter } from "@ada-anvil/vault/express";
import { Vault } from "@ada-anvil/vault/vault";
import express from "express";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "preprod",
});

const app = express();
app.use(express.json());

app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);

app.listen(3000);
```

---

### `expressAdapter`

The express adapter instance that implements the `HandlerAdapter` interface.

```typescript
type ExpressAdapter = HandlerAdapter<
  [req: Request, res: Response],
  { req: Request; res: Response },
  void
>;

const expressAdapter: ExpressAdapter = {
  getContext: (req: Request, res: Response) => ({ req, res }),
  getBody: (ctx) => ctx.req.body || {},
  getMethod: (ctx) => ctx.req.method,
  getPath: (ctx) => ctx.req.path,
  getQuery: (ctx) => ctx.req.query as Record<string, unknown>,
  sendResponse: (ctx, result) => {
    if (isErr(result)) {
      ctx.res.status(result.statusCode).json(errorToJson(result));
    } else {
      ctx.res.status(200).json(result.response);
    }
  },
};
```

| Function                        | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| `getContext(req, res)`          | Creates the context from the Express request and response |
| `getBody(context)`              | Returns `req.body` (requires `express.json()` middleware) |
| `getMethod(context)`            | Returns the HTTP method from `req.method`                 |
| `getPath(context)`              | Returns the request path from `req.path`                  |
| `getQuery(context)`             | Returns the query parameters from `req.query`             |
| `sendResponse(context, result)` | Sends a JSON response with the appropriate status code    |

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

## API Endpoints

When using the Express adapter with `createVaultHandler`, the following endpoints are automatically available:

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

## Requirements

### JSON Body Parser

The Express adapter requires the `express.json()` middleware to parse JSON request bodies:

```typescript
import express from "express";

const app = express();
app.use(express.json()); // Required !

app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);
```

Without this middleware, POST requests will fail because `req.body` will be undefined.

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
      ...expressAdapter,
      getPath: (ctx) => ctx.req.path.replace("/users/me", `/users/${userId}`),
    },
  })
);
```

### Multiple Vault Instances

```typescript
import { createVaultHandler } from "@ada-anvil/vault";
import { expressAdapter } from "@ada-anvil/vault/express";
import { Vault } from "@ada-anvil/vault/vault";
import express from "express";

const mainnetVault = new Vault({
  rootKey: () => process.env.MAINNET_ROOT_KEY,
  network: "mainnet",
});

const testnetVault = new Vault({
  rootKey: () => process.env.TESTNET_ROOT_KEY,
  network: "preprod",
});

const app = express();
app.use(express.json());

app.all(
  "/mainnet",
  createVaultHandler({
    vault: mainnetVault,
    adapter: expressAdapter,
  })
);
app.all(
  "/testnet",
  createVaultHandler({
    vault: testnetVault,
    adapter: expressAdapter,
  })
);

app.listen(3000);
```

---

## Dependencies

- **`express`**: Express.js framework (peer dependency)

---

## Related Packages

- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@ada-anvil/vault/vault](../vault/README.md)**: Main vault implementation

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
