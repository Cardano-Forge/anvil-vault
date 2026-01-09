# @ada-anvil/vault/hono

## Usage

```typescript
import { createVaultHandler } from "@ada-anvil/vault";
import { honoAdapter } from "@ada-anvil/vault/hono";
import { Vault } from "@ada-anvil/vault/vault";
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

## Dependencies

- **`trynot`**: Result type and error handling

---

## Related Packages

- **[@ada-anvil/vault/vault](../vault/README.md)**: Vault implementation
- **[@ada-anvil/vault/handler](../handler/README.md)**: Framework-agnostic handler builder

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
