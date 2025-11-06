# Hono Example

A complete working example demonstrating how to integrate Anvil Vault with Hono, a modern, lightweight web framework. This example shows how to build a fast, type-safe custodial wallet API that can run on multiple runtimes including Node.js, Cloudflare Workers, Deno, and Bun.

## Overview

This example demonstrates:

- Setting up a Hono server with Anvil Vault
- Configuring the vault with secure derivation strategies
- Using the Hono adapter for seamless integration
- Implementing a simplified authentication pattern for development
- Handling graceful shutdown with proper signal handling
- Multi-runtime compatibility

## Why Hono?

- **Fast**: One of the fastest web frameworks available
- **Lightweight**: Small bundle size, perfect for edge computing
- **Multi-Runtime**: Works on Cloudflare Workers, Deno, Bun, and Node.js
- **Type-Safe**: Excellent TypeScript support with type inference
- **Modern**: Built for modern JavaScript runtimes and standards

## Prerequisites

- Node.js >= 20.0.0 (or Deno/Bun)
- npm or compatible package manager
- Basic understanding of Hono

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Server

```bash
npm run dev
```

The server will start on port `3000` and be ready to accept requests.

### 3. Test the API

```bash
# Get wallet addresses
curl http://localhost:3000/users/me/wallet

# Sign data
curl -X POST http://localhost:3000/users/me/sign-data \
  -H "Content-Type: application/json" \
  -d '{"payload":"48656c6c6f"}'

# Sign transaction
curl -X POST http://localhost:3000/users/me/sign-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction":"84a500...."}'
```

## Code Walkthrough

Let's break down the implementation in `src/index.ts`:

### 1. Configuration

```typescript
const env = {
  ME: "f3aa7d40-58c2-44df-ba49-d4026c822571",
  ROOT_KEY:
    "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57...",
  NETWORK: "preprod",
} as const;
```

**Configuration breakdown:**

- `ME`: A hardcoded UUID representing the current user (for demo purposes)
- `ROOT_KEY`: The BIP32 root private key in hex format (⚠️ **Never hardcode in production!**)
- `NETWORK`: The Cardano network to use (`preprod`, `mainnet`, or `preview`)

### 2. Hono Application Setup

```typescript
const app = new Hono();
```

**Application setup:**

- Creates a new Hono application instance
- Hono automatically handles JSON parsing, no middleware needed!

### 3. Vault Configuration

```typescript
app.use(
  createVaultHandler({
    vault: new Vault({
      rootKey: () => env.ROOT_KEY,
      network: env.NETWORK,
      paymentDerivation: {
        type: "unique",
        scrambler: (path) => path.reverse(),
      },
    }),
    adapter: {
      ...honoAdapter,
      getPath: (ctx) => ctx.req.path.replace("/users/me", `/users/${env.ME}`),
    },
  })
);
```

**Configuration details:**

**Vault Configuration:**

- `rootKey`: Function that returns the root private key (allows async loading in production)
- `network`: Specifies which Cardano network to use
- `paymentDerivation`: Configures how payment keys are derived
  - `type: "unique"`: Each user gets a unique derivation path based on their UUID
  - `scrambler`: Reverses the derivation path for additional security

**Adapter Configuration:**

- Spreads the `honoAdapter` to use default Hono integration
- Overrides `getPath` to replace `/users/me` with the actual user ID
- This allows using `/users/me` as a convenient alias during development

### 4. Server Startup

```typescript
const server = serve(app, (info) => {
  console.log(`listening on port ${info.port}`);
});
```

**Server initialization:**

- Uses `@hono/node-server` to run Hono on Node.js
- The `serve` function starts the server and returns a server instance
- Logs the port when the server is ready

### 5. Graceful Shutdown

```typescript
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
```

**Shutdown handling:**

- Listens for `SIGINT` (Ctrl+C) and `SIGTERM` signals
- Closes the server gracefully before exiting
- Handles errors during shutdown
- Ensures all connections are properly closed

## Available Endpoints

The vault handler automatically creates the following REST endpoints:

### `GET /users/me/wallet`

Returns wallet addresses for the current user.

**Response:**

```json
{
  "addresses": {
    "base": {
      "bech32": "addr_test1qz...",
      "hex": "00..."
    },
    "enterprise": {
      "bech32": "addr_test1vz...",
      "hex": "60..."
    },
    "reward": {
      "bech32": "stake_test1uz...",
      "hex": "e0..."
    }
  }
}
```

### `POST /users/me/sign-data`

Signs arbitrary data using CIP-8/CIP-30 standards.

**Request:**

```json
{
  "payload": "48656c6c6f",
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

### `POST /users/me/sign-transaction`

Signs a Cardano transaction.

**Request:**

```json
{
  "transaction": "84a500d90102..."
}
```

**Response:**

```json
{
  "signedTransaction": "84a500d90102...",
  "witnessSet": "a10081825820..."
}
```

For complete API documentation, see the [handler package documentation](../../packages/handler/README.md#rest-api-endpoints).

## Understanding the `/users/me` Pattern

This example uses a simplified authentication pattern:

```typescript
getPath: (ctx) => ctx.req.path.replace("/users/me", `/users/${env.ME}`);
```

**Pattern explanation:**

1. Client requests `/users/me/wallet`
2. Adapter rewrites path to `/users/f3aa7d40-58c2-44df-ba49-d4026c822571/wallet`
3. Vault handler processes the request with the actual user ID

## Troubleshooting

### Invalid Transaction Format

**Error:** `Bad request` when signing transactions

**Solution:** Ensure the transaction is hex-encoded CBOR. You can create a valid transaction using `@emurgo/cardano-serialization-lib-nodejs`.

### Network Mismatch

**Error:** Addresses don't match expected format

**Solution:** Verify the `NETWORK` configuration matches your intended network (`mainnet`, `preprod`, or `preview`).

## Related Documentation

- [Framework Documentation](../../packages/framework/README.md) - Complete Anvil Vault guide
- [Hono Adapter](../../packages/hono/README.md) - Hono adapter documentation
- [Handler Package](../../packages/handler/README.md) - REST API reference
- [Vault Package](../../packages/vault/README.md) - Vault configuration and usage
- [Hono Official Docs](https://hono.dev/) - Hono framework documentation
