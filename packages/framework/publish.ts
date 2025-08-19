import { build } from "tsup";

async function main() {
  await build({
    entryPoints: ["src/*.ts"],
    format: ["cjs", "esm"],
    dts: { resolve: true },
    clean: true,
    outDir: "out",
    splitting: true,
    treeshake: true,
    noExternal: [/@anvil-vault\/.*/],
    external: [
      "bip39",
      "@emurgo/cardano-serialization-lib-nodejs-gc",
      "@emurgo/cardano-message-signing-nodejs-gc",
      "zod",
    ],
  });
}

main();
