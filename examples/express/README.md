# Express example

A minimal example showing how to run the Anvil Vault Express adapter locally. This example exposes the vault api so you can see how the adapter integrates with an Express-based HTTP server.

## Prerequisites

- Node.js (18+ recommended)
- npm (or compatible package manager)

## Install

Install dependencies:

```bash
npm install
```

## Run (development)

Start the example server in development mode:

```bash
npm run dev
```

The server will listen on the port configured in the example (commonly `3000`).

## Example endpoint

- GET /users/me/wallet

Example request:

```
GET http://localhost:3000/users/me/wallet
```

This endpoint returns wallet information provided by the example adapter. See `src/index.ts` for implementation details.

Complete vault api definition can be found in [`hanlder-builder.ts`]("../../../../packages/handler/src/handler-builder.ts")

## Project layout

- `src/` — example Express server source (entry: `src/index.ts`)

## Notes

- This example is intended for local development and to demonstrate adapter usage. It may use mocked data or simplified auth for clarity.
- For production use, review configuration, environment variables, and security settings. Ensure middleware, CORS, and auth are configured appropriately for your deployment.

For more information about the repository and other examples, see the project root `README.md`.
