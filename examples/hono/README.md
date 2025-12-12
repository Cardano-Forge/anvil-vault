# @ada-anvil/vault with Hono

A minimal example showing how to run the Anvil Vault Hono adapter locally.

> [!INFO] This example is intended for local development and to demonstrate adapter usage. It may use mocked data or simplified auth for clarity.

> [!WARNING] For production use, review configuration, environment variables, and security settings. Ensure middleware, CORS, and auth are configured appropriately for your deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [API Endpoint](#api-endpoint)
- [Dependencies](#dependencies)

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

## usage

```bash
npm install
npm run dev
```

The server will start on port **3000**:

## API Endpoint

All endpoints follow the pattern `users/:userId/*`. The examples below use `/users/me` which maps to the test user ID.

### Get Wallet Addresses

```bash
curl http://localhost:3000/users/me/wallet
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

## Dependencies

- **`Hono`** - Web framework
- **`trynot`** - Result type for error handling

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
