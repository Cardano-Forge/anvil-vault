# @ada-anvil/vault/express

This package provides seamless integration between Anvil Vault and Express.js applications.

All functions return `Result` types from `trynot`. See [Error Handling](../framework/README.md#error-handling) for details.

## Usage

> [!WARNING]
> The Express adapter requires the `express.json()` middleware to parse JSON request bodies.
> Without this middleware, POST requests will fail because `req.body` will be undefined.

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

## Dependencies

- **`trynot`**: Result type for error handling

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
