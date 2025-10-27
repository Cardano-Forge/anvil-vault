import { expressAdapter } from "@anvil-vault/express";
import { createVaultHandler } from "@anvil-vault/handler";
import { Vault } from "@anvil-vault/vault";
import express from "express";

const env = {
  ME: "f3aa7d40-58c2-44df-ba49-d4026c822571",
  ROOT_KEY:
    "40d0f8821976d097ad6c22e75f3ee2e725750a33f9e0c8ba4978245e9b74ae57604f2a17296ef2dcd9febf5e14adc4efe627bf5666db302da2ee1e94009f8c9bf529816cb417e611404426a46aca8697f7e815032a07aa156ed0fbbe5aa75cdc",
  NETWORK: "preprod",
} as const;

const app = express();

app.use(express.json());

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
  }),
);

const server = app.listen(3001, () => {
  console.log("listening on port 3001");
});

process.on("SIGINT", () => {
  console.log("SIGINT received, exiting");
  server.close();
  process.exit(0);
});
