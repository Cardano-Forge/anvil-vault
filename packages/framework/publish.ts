import { copyFile } from "node:fs/promises";
import path from "node:path";
import { build } from "tsup";

const outDir = "out";

async function main() {
  await build({
    entryPoints: ["src/*.ts"],
    format: ["cjs", "esm"],
    dts: { resolve: true },
    clean: true,
    outDir,
    splitting: false,
    treeshake: true,
    noExternal: [/@anvil-vault\/.*/],
    external: [
      "bip39",
      "@emurgo/cardano-serialization-lib-nodejs-gc",
      "@emurgo/cardano-message-signing-nodejs-gc",
      "zod",
    ],
  });
  await copyFile("package.json", path.join(outDir, "package.json"));
}

main();
