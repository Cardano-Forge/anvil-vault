import { type Options, build } from "tsup";
import { type AddPackageJsonOpts, addPackageJson } from "./add-package-json";
import { buildInternalPackageTypes } from "./build-internal-package-types";

export type PublishOpts = Pick<AddPackageJsonOpts, "name" | "peerDependencies">;

export async function publish(config: Options, opts: PublishOpts = {}) {
  const outDir = config.outDir ?? "dist";
  const format = config.format ?? "esm";
  const dtsOnly = typeof config.dts === "object" ? (config.dts.only ?? false) : false;
  await build(config);
  console.log("Building internal package types...");
  await buildInternalPackageTypes({ outDir, format });
  console.log("Adding package.json...");
  await addPackageJson({
    outDir,
    dtsOnly,
    ...opts,
  });
}
