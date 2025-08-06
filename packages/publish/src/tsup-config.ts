import type { Options } from "tsup";

export const publishConfig: Options = {
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: { resolve: true },
  clean: true,
  outDir: "out",
  splitting: true,
  treeshake: true,
  noExternal: [/^@anvil-vault\/.*/, /^@cardano-forge\/.*/],
  external: [
    "@emurgo/cardano-serialization-lib-nodejs-gc",
    "zod",
    "cassandra-driver",
    "trynot",
    "cachedts",
  ],
};

export function getTsupPublishConfig(opts: Partial<Options> = {}): Options {
  return { ...publishConfig, ...opts };
}
