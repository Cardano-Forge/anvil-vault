import { createVaultHandler } from "@anvil-vault/handler";
import { honoAdapter } from "@anvil-vault/hono";
import { Vault } from "@anvil-vault/vault";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const env = {
  ME: "f3aa7d40-58c2-44df-ba49-d4026c822571",
  ROOT_KEY:
    "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57604f2a17296ef2dcd9febf5e14adc4efe627bf5666db302da2ee1e94009f8c9bf529816cb417e611404426a46aca8697f7e815032a07aa156ed0fbbe5aa75cdc",
  NETWORK: "preprod",
} as const;

const app = new Hono();
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
    adapter: honoAdapter,
  }),
);
const server = serve(app);

// graceful shutdown
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
