# @anvil-vault/express

Express.js adapter for Anvil Vault handlers. This package provides seamless integration between Anvil Vault and Express.js applications.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [expressAdapter](#expressadapter)
  - [ExpressAdapter](#expressadapter-1)
- [Usage Examples](#usage-examples)
  - [Basic Setup](#basic-setup)
  - [With Authentication Middleware](#with-authentication-middleware)
  - [With Rate Limiting](#with-rate-limiting)
  - [With Error Handling](#with-error-handling)
  - [Multiple Vault Instances](#multiple-vault-instances)
- [API Endpoints](#api-endpoints)
- [Requirements](#requirements)
  - [JSON Body Parser](#json-body-parser)
- [Error Responses](#error-responses)
- [TypeScript Support](#typescript-support)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/express
```

## Overview

The Express adapter implements the `HandlerAdapter` interface from `@anvil-vault/handler`, allowing you to use Anvil Vault with Express.js applications. It handles:

- **Request Context**: Extracts Express request and response objects
- **Body Parsing**: Reads JSON request bodies
- **Query Parameters**: Extracts query string parameters
- **Response Handling**: Sends JSON responses with appropriate status codes
- **Error Formatting**: Converts vault errors to JSON error responses


## API Reference

- [expressAdapter](#expressadapter)
- [ExpressAdapter](#expressadapter-1)

### `expressAdapter`

The main adapter instance that implements the `HandlerAdapter` interface.

**Type:** `ExpressAdapter`

**Methods:**

- `getContext(req, res)` - Creates context from Express request and response
- `getBody(context)` - Returns `req.body` (requires `express.json()` middleware)
- `getMethod(context)` - Returns HTTP method from `req.method`
- `getPath(context)` - Returns request path from `req.path`
- `getQuery(context)` - Returns query parameters from `req.query`
- `sendResponse(context, result)` - Sends JSON response with appropriate status code

**Example:**

```typescript
import { expressAdapter } from "@anvil-vault/express";
import { createVaultHandler } from "@anvil-vault/handler";

app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);
```

---

### `ExpressAdapter`

TypeScript type for the Express adapter.

**Type:**

```typescript
type ExpressAdapter = HandlerAdapter<
  [req: Request, res: Response],
  { req: Request; res: Response },
  void
>;
```

**Generic Parameters:**

- `TParams`: `[req: Request, res: Response]` - Express route handler parameters
- `TContext`: `{ req: Request; res: Response }` - Context object containing request and response
- `TResponse`: `void` - Express handlers don't return a value

---

## Usage Examples

### Basic Setup

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import { Vault } from "@anvil-vault/vault";
import express from "express";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
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

#### Overriding getPath (advanced)

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";

const handler = createVaultHandler({
  vault,
  adapter: {
    ...expressAdapter,
    getPath: (ctx) =>
      ctx.req.path.replace("/users/me", `/users/${ctx.req.user.id}`),
  },
});
```

---

### With Authentication Middleware

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

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Verify token and attach user to request
  req.user = verifyToken(token);
  next();
};

// Authorization middleware
const authorize = (req, res, next) => {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

const handler = createVaultHandler({ vault, adapter: expressAdapter });

app.all("/users/:userId/*", authenticate, authorize, handler);

app.listen(3000);
```

---

### With Rate Limiting

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import { Vault } from "@anvil-vault/vault";
import express from "express";
import rateLimit from "express-rate-limit";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = express();
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

const handler = createVaultHandler({ vault, adapter: expressAdapter });

app.all("/users/:userId/*", limiter, handler);

app.listen(3000);
```

---

### With Error Handling

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

app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    statusCode: 500,
    error: "Internal server error",
  });
});

app.listen(3000);
```

---

### Multiple Vault Instances

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { expressAdapter } from "@anvil-vault/express";
import { Vault } from "@anvil-vault/vault";
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

const mainnetHandler = createVaultHandler({
  vault: mainnetVault,
  adapter: expressAdapter,
});

const testnetHandler = createVaultHandler({
  vault: testnetVault,
  adapter: expressAdapter,
});

app.all("/mainnet/users/:userId/*", mainnetHandler);
app.all("/testnet/users/:userId/*", testnetHandler);

app.listen(3000);
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
app.use(express.json()); // Required!

app.use(
  createVaultHandler({
    vault,
    adapter: expressAdapter,
  })
);
```

Without this middleware, POST requests will fail because `req.body` will be undefined.

---

## Error Responses

The adapter automatically formats errors as JSON responses with appropriate HTTP status codes:

**Success Response (200):**

```json
{
  "addresses": {
    "base": { "bech32": "addr1...", "hex": "00..." },
    "enterprise": { "bech32": "addr1...", "hex": "60..." },
    "reward": { "bech32": "stake1...", "hex": "e0..." }
  }
}
```

**Error Response (400/404/500):**

```json
{
  "statusCode": 400,
  "error": "Bad request"
}
```

---

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import type { ExpressAdapter } from "@anvil-vault/express";
import { expressAdapter } from "@anvil-vault/express";

// The adapter is fully typed
const adapter: ExpressAdapter = expressAdapter;
```

---

## Dependencies

- **`@anvil-vault/handler`**: Handler adapter interface
- **`@anvil-vault/utils`**: Error handling utilities
- **`trynot`**: Result type and error handling
- **`express`**: Express.js framework (peer dependency)

---

## Related Packages

- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/hono](../hono/README.md)**: Hono adapter
- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/framework](../framework/README.md)**: Complete framework package

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/yyTG6wUqCh">Discord</a>
  |
  <a href="https://x.com/AnvilDevAgency">@ada_anvil</a>
</p>
