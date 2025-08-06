import type { Options } from "tsup";

export const buildConfig: Options = {
  external: ["pg"],
  entry: ["src/index.ts"],
  outDir: "dist",
  bundle: true,
  minify: false,
  splitting: false,
  treeshake: false,
  clean: true,
  dts: false,
  shims: true,
  format: "esm",
};

export function getTsupBuildConfig(opts: Partial<Options> = {}): Options {
  return { ...buildConfig, ...opts };
}

export const emitConfig: Options = {
  entry: ["src/index.ts"],
  outDir: "out",
  bundle: true,
  minify: false,
  splitting: false,
  treeshake: false,
  clean: true,
  dts: { only: true },
  format: "esm",
};

export function getTsupEmitConfig(opts: Partial<Options> = {}): Options {
  return { ...emitConfig, ...opts };
}
