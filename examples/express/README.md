# Express Example

A complete working example demonstrating how to integrate Anvil Vault with Express.js. This example shows the minimal setup required to create a custodial wallet API with secure key derivation and transaction signing capabilities.

## Overview

This example demonstrates:

- Setting up an Express.js server with Anvil Vault
- Configuring the vault with secure derivation strategies
- Using the Express adapter for seamless integration
- Implementing a simplified authentication pattern for development
- Handling graceful shutdown

## Prerequisites

- Node.js >= 18.0.0
- npm or compatible package manager
- Basic understanding of Express.js

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Server

```bash
npm run dev
```

The server will start on port `3001` and be ready to accept requests.

### 3. Test the API

```bash
# Get wallet addresses
curl http://localhost:3001/users/me/wallet

# Sign data
curl -X POST http://localhost:3001/users/me/sign-data \
  -H "Content-Type: application/json" \
  -d '{"payload":"48656c6c6f"}'

# Sign transaction
curl -X POST http://localhost:3001/users/me/sign-transaction \
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

**What's happening:**

- `ME`: A hardcoded UUID representing the current user (for demo purposes)
- `ROOT_KEY`: The BIP32 root private key in hex format (⚠️ **Never hardcode in production!**)
- `NETWORK`: The Cardano network to use (`preprod`, `mainnet`, or `preview`)

### 2. Express Setup

```typescript
const app = express();
app.use(express.json());
```

**What's happening:**

- Creates an Express application
- Adds JSON body parser middleware (required for POST requests)

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
      ...expressAdapter,
      getPath: (ctx) => ctx.req.path.replace("/users/me", `/users/${env.ME}`),
    },
  })
);
```

**What's happening:**

**Vault Configuration:**

- `rootKey`: Function that returns the root private key (allows async loading in production)
- `network`: Specifies which Cardano network to use
- `paymentDerivation`: Configures how payment keys are derived
  - `type: "unique"`: Each user gets a unique derivation path based on their UUID
  - `scrambler`: Reverses the derivation path for additional security

**Adapter Configuration:**

- Spreads the `expressAdapter` to use default Express integration
- Overrides `getPath` to replace `/users/me` with the actual user ID
- This allows using `/users/me` as a convenient alias during development

### 4. Server Startup

```typescript
const server = app.listen(3001, () => {
  console.log("listening on port 3001");
});
```

**What's happening:**

- Starts the Express server on port 3001
- Logs a message when the server is ready

### 5. Graceful Shutdown

```typescript
process.on("SIGINT", () => {
  console.log("SIGINT received, exiting");
  server.close();
  process.exit(0);
});
```

**What's happening:**

- Listens for `SIGINT` signal (Ctrl+C)
- Closes the server gracefully before exiting
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

**How it works:**

1. Client requests `/users/me/wallet`
2. Adapter rewrites path to `/users/f3aa7d40-58c2-44df-ba49-d4026c822571/wallet`
3. Vault handler processes the request with the actual user ID

**In production:**

- Replace this with proper authentication middleware
- Extract the user ID from JWT tokens or session data
- Validate that the authenticated user matches the requested user ID

## Security Considerations

⚠️ **This example is for development and demonstration purposes only!**

### What's NOT Production-Ready

1. **Hardcoded Root Key**

   - Never hardcode private keys in source code
   - Use environment variables or secure key management systems (AWS KMS, HashiCorp Vault)

2. **No Authentication**

   - Anyone can access any user's wallet
   - Implement JWT authentication or session-based auth

3. **No Authorization**

   - No validation that the requester owns the wallet
   - Verify authenticated user matches the requested user ID

4. **No Rate Limiting**

   - Vulnerable to abuse and DoS attacks
   - Implement rate limiting with `express-rate-limit`

5. **No HTTPS**
   - Data transmitted in plain text
   - Use HTTPS in production with valid SSL certificates

## Troubleshooting

### Invalid Transaction Format

**Error:** `Bad request` when signing transactions

**Solution:** Ensure the transaction is hex-encoded CBOR. You can create a valid transaction using `@emurgo/cardano-serialization-lib-nodejs`.

### Network Mismatch

**Error:** Addresses don't match expected format

**Solution:** Verify the `NETWORK` configuration matches your intended network (`mainnet`, `preprod`, or `preview`).

## Related Documentation

- [Framework Documentation](../../packages/framework/README.md) - Complete Anvil Vault guide
- [Express Adapter](../../packages/express/README.md) - Express adapter documentation
- [Handler Package](../../packages/handler/README.md) - REST API reference
- [Vault Package](../../packages/vault/README.md) - Vault configuration and usage
