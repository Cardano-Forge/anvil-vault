import { readFile, writeFile } from "node:fs/promises";

export type AddPackageJsonOpts = {
  outDir: string;
  dtsOnly: boolean;
  name?: string;
  peerDependencies?: Record<string, string>;
};

export async function addPackageJson(opts: AddPackageJsonOpts) {
  const pkg = JSON.parse(await readFile("./package.json", "utf8"));
  const name = opts.name ?? pkg.name.split("/")[1];
  if (!name) {
    throw new Error("Missing package name");
  }

  const res: Record<string, unknown> = {
    name: `@cardano-forge/${name}`,
    version: pkg.version,
    files: ["**"],
  };

  if (opts.dtsOnly) {
    Object.assign(res, {
      types: "./index.d.ts",
      typings: "./index.d.ts",
      exports: {
        ".": {
          import: "./index.d.ts",
          require: "./index.d.ts",
          types: "./index.d.ts",
        },
      },
    });
  } else {
    Object.assign(res, {
      main: "./index.cjs",
      module: "./index.js",
      types: "./index.d.ts",
      typings: "./index.d.ts",
      exports: {
        ".": {
          import: {
            import: "./index.js",
            types: "./index.d.ts",
          },
          require: {
            require: "./index.cjs",
            types: "./index.d.cts",
          },
          types: "./index.d.ts",
        },
      },
    });
  }

  const dependencies = extractDependencies(pkg, opts);
  if (dependencies.size > 0) {
    res.peerDependencies = Object.fromEntries(dependencies);
  }

  writeFile(`${opts.outDir}/package.json`, JSON.stringify(res, null, 2));
}

// biome-ignore lint/suspicious/noExplicitAny:
function extractDependencies(pkg: any, opts: AddPackageJsonOpts): Map<string, string> {
  if (opts.peerDependencies) {
    return new Map(Object.entries(opts.peerDependencies));
  }

  const dependencies = new Map<string, string>();

  for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
    if (name.startsWith("@anvil-vault/") || name.startsWith("@cardano-forge/")) {
      continue;
    }
    if (typeof version !== "string") {
      continue;
    }
    const majorVersion = Number(version.split(".")[0]?.replace("^", ""));
    if (Number.isNaN(majorVersion)) {
      continue;
    }
    dependencies.set(name, `${majorVersion}.x`);
  }

  if (pkg.dependencies?.["@anvil-vault/csl"]) {
    dependencies.set("@emurgo/cardano-serialization-lib-nodejs-gc", ">= 13.1.0");
  }

  return dependencies;
}
