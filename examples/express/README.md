# @ada-anvil/vault with Express

Complete working example of integrating Anvil Vault with Express.js.

## Table of Contents

- [What This Example Does](#what-this-example-does)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Example](#running-the-example)
- [API Endpoints](#api-endpoints)
- [Code Walkthrough](#code-walkthrough)
- [Dependencies](#dependencies)
- [Learn More](#learn-more)
- [Security Notes](#security-notes)

## What This Example Does

This example demonstrates how easy it is to integrate Anvil Vault with Express:

- **Simple setup** - Just a few lines to create a fully functional vault API
- **Three REST endpoints** - Get wallet addresses, sign data, and sign transactions
- **Custom path mapping** - Shows how to adapt paths for your use case (e.g., `/users/me`)

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

## Installation

```bash
npm install
```

## Configuration

The example uses hardcoded values for demonstration purposes:

```typescript
const env = {
  ME: "f3aa7d40-58c2-44df-ba49-d4026c822571",
  ROOT_KEY:
    "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57604f2a17296ef2dcd9febf5e14adc4efe627bf5666db302da2ee1e94009f8c9bf529816cb417e611404426a46aca8697f7e815032a07aa156ed0fbbe5aa75cdc",
  NETWORK: "preprod",
};
```

**For production:** Replace these with environment variables:

```typescript
const env = {
  ME: process.env.USER_ID,
  ROOT_KEY: process.env.ROOT_KEY,
  NETWORK: process.env.NETWORK,
};
```

## Running the Example

```bash
npm run dev
```

The server will start on port **3001**:

```bash
listening on port 3001
```

## API Endpoints

All endpoints follow the pattern `users/:userId/*`. The examples below use `/users/me` which maps to the test user ID.

### Get Wallet Addresses

```bash
curl http://localhost:3001/users/me/wallet
```

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

### Sign Data

```bash
curl -X POST http://localhost:3001/users/me/sign-data \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "48656c6c6f2c2043617264616e6f21"
  }'
```

**Response:**

```json
{
  "signature": "845846a2012...",
  "key": "a401012..."
}
```

### Sign Transaction

```bash
curl -X POST http://localhost:3001/users/me/sign-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "84a500d90102..."
  }'
```

**Response:**

```json
{
  "signedTransaction": "84a500d90102...",
  "witnessSet": "a10081825820..."
}
```

## Code Walkthrough

### 1. Vault Configuration

```typescript
const vault = new Vault({
  rootKey: () => env.ROOT_KEY,
  network: env.NETWORK,
  paymentDerivation: {
    type: "unique",
    scrambler: (path) => path.reverse(),
  },
});
```

- **rootKey**: Function returning the root private key
- **network**: Cardano network (preprod for testing)
- **paymentDerivation**: Unique derivation with path scrambling for security

### 2. Handler Setup

```typescript
app.use(
  createVaultHandler({
    vault,
    adapter: {
      ...expressAdapter,
      getPath: (ctx) => ctx.req.path.replace("/users/me", `/users/${env.ME}`),
    },
  })
);
```

The `createVaultHandler` creates middleware that handles all vault operations. The `expressAdapter` adapts Express request/response to the vault handler interface. The custom `getPath` function maps the convenience endpoint `/users/me` to the actual user ID path.

### 3. Graceful Shutdown

```typescript
process.on("SIGINT", () => {
  console.log("SIGINT received, exiting");
  server.close();
  process.exit(0);
});
```

Cleanly shuts down the server on Ctrl+C.

## Dependencies

- **`@ada-anvil/vault`** - Anvil Vault implementation
- **`express`** - Web framework
- **`trynot`** - Result type for error handling

## Learn More

- **[@anvil-vault/framework](../../packages/framework/README.md)** - Framework overview

## Security Notes

> [!WARNING] **This example uses hardcoded credentials for demonstration only.**

For production:

1. **Never hardcode root keys** - Use environment variables or key management systems
2. **Use unique user IDs** - UUIDs, not sequential integers
3. **Add authentication** - Verify user identity before operations
4. **Rate limiting** - Prevent abuse of signing endpoints

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
