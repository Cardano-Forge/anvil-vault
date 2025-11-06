# @anvil-vault/hono

Hono adapter for Anvil Vault handlers. This package provides seamless integration between Anvil Vault and Hono applications.

All functions return `Result` types from the [`trynot`](https://www.npmjs.com/package/trynot) library for consistent error handling.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [honoAdapter](#honoadapter)
  - [HonoAdapter](#honoadaptertenv)
- [Usage Examples](#usage-examples)
  - [Basic Setup](#basic-setup)
  - [With Authentication Middleware](#with-authentication-middleware)
  - [With Rate Limiting](#with-rate-limiting)
  - [With CORS](#with-cors)
  - [With Custom Environment Types](#with-custom-environment-types)
  - [Multiple Vault Instances](#multiple-vault-instances)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
  - [Cloudflare Workers](#cloudflare-workers)
  - [Deno Deploy](#deno-deploy)
  - [Bun](#bun)
  - [Node.js](#nodejs)
- [Error Responses](#error-responses)
- [TypeScript Support](#typescript-support)
- [Advantages of Hono](#advantages-of-hono)
- [Dependencies](#dependencies)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @anvil-vault/hono
```

## Overview

The Hono adapter implements the `HandlerAdapter` interface from `@anvil-vault/handler`, allowing you to use Anvil Vault with Hono applications. It handles:

- **Request Context**: Extracts Hono context object
- **Body Parsing**: Reads JSON request bodies
- **Query Parameters**: Extracts query string parameters
- **Response Handling**: Returns JSON responses with appropriate status codes
- **Error Formatting**: Converts vault errors to JSON error responses
- **Type Safety**: Full TypeScript support with Hono's type system

All functions return `Result` types from the `trynot` library for consistent error handling.

## Quick Start

- [Hono Quick Start](../../examples/hono/README.md#quick-start)

## API Reference

- [honoAdapter](#honoadapter)
- [HonoAdapter](#honoadaptertenv)

### `honoAdapter`

The main adapter instance that implements the `HandlerAdapter` interface.

**Type:** `HonoAdapter`

**Methods:**

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

## Usage Examples

### Basic Setup

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
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

---

### With Authentication Middleware

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = new Hono();

// Authentication middleware
app.use("/users/*", bearerAuth({ token: process.env.API_TOKEN }));

// Authorization middleware
app.use("/users/:userId/*", async (c, next) => {
  const userId = c.req.param("userId");
  const authenticatedUserId = c.get("userId"); // From auth middleware

  if (userId !== authenticatedUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

export default app;
```

---

### With Rate Limiting

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = new Hono();

// Rate limiting
const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: "draft-6",
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "unknown",
});

app.use("/users/*", limiter);

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

export default app;
```

---

### With CORS

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";
import { cors } from "hono/cors";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = new Hono();

// CORS middleware
app.use(
  "/users/*",
  cors({
    origin: ["https://example.com", "https://app.example.com"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

export default app;
```

---

### With Custom Environment Types

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

type Env = {
  Bindings: {
    ROOT_KEY: string;
    DB: D1Database;
  };
  Variables: {
    userId: string;
  };
};

const app = new Hono<Env>();

app.all("/users/:userId/*", async (c) => {
  const vault = new Vault({
    rootKey: () => c.env.ROOT_KEY,
    network: "mainnet",
  });

  const handler = createVaultHandler({ vault, adapter: honoAdapter });
  return handler(c);
});

export default app;
```

---

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

## Deployment

### Cloudflare Workers

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

type Env = {
  ROOT_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

app.all("/users/:userId/*", async (c) => {
  const vault = new Vault({
    rootKey: () => c.env.ROOT_KEY,
    network: "mainnet",
  });

  const handler = createVaultHandler({ vault, adapter: honoAdapter });
  return handler(c);
});

export default app;
```

### Deno Deploy

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";

const vault = new Vault({
  rootKey: () => Deno.env.get("ROOT_KEY")!,
  network: "mainnet",
});

const app = new Hono();

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

Deno.serve(app.fetch);
```

### Bun

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

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

export default {
  port: 3000,
  fetch: app.fetch,
};
```

### Node.js

```typescript
import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const vault = new Vault({
  rootKey: () => process.env.ROOT_KEY,
  network: "mainnet",
});

const app = new Hono();

app.use(
  createVaultHandler({
    vault,
    adapter: honoAdapter,
  })
);

serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Vault API running on port 3000");
```

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
import type { HonoAdapter } from "@anvil-vault/hono";
import { honoAdapter } from "@anvil-vault/hono";
import type { Env } from "hono";

// The adapter is fully typed
const adapter: HonoAdapter = honoAdapter;

// With custom environment
type CustomEnv = {
  Bindings: {
    ROOT_KEY: string;
  };
};

const customAdapter: HonoAdapter<CustomEnv> = honoAdapter;
```

---

## Advantages of Hono

- **Fast**: Hono is one of the fastest web frameworks
- **Lightweight**: Small bundle size, perfect for edge computing
- **Multi-Runtime**: Works on Cloudflare Workers, Deno, Bun, and Node.js
- **Type-Safe**: Full TypeScript support with excellent type inference
- **Modern**: Built for modern JavaScript runtimes and standards

---

## Dependencies

- **`@anvil-vault/handler`**: Handler adapter interface
- **`@anvil-vault/utils`**: Error handling utilities
- **`trynot`**: Result type and error handling
- **`hono`**: Hono web framework (peer dependency)

---

## Related Packages

- **[@anvil-vault/handler](../handler/README.md)**: Framework-agnostic handler builder
- **[@anvil-vault/express](../express/README.md)**: Express.js adapter
- **[@anvil-vault/vault](../vault/README.md)**: Main vault implementation
- **[@anvil-vault/framework](../framework/README.md)**: Complete framework package

---

<p align="center">
  <a href="https://ada-anvil.io">Ada Anvil</a>
  |
  <a href="https://discord.gg/RN4D7wzc">Discord</a>
  |
  <a href="https://x.com/ada_anvil">@ada_anvil</a>
</p>
