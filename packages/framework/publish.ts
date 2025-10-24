import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, type Options } from "tsup";
import internalPkg from "./package.json" with { type: "json" };

const OUT_DIR = "out";
const INTERNAL_PKG_ORG = "@anvil-vault";
const INTERNAL_IMPORT_REGEX = new RegExp(
  `(import |export )(.*)( from ["']${INTERNAL_PKG_ORG}\\/)(.*)(["'];)`,
  "g",
);
const FROM_INTERNAL_REGEX = new RegExp(`(["'])(${INTERNAL_PKG_ORG}\\/)(.*)(["'])`);

const RESULT_IMPORT_REGEX = /import { Result } from 'trynot';/g;

const externalDeps = {
  bip39: ">=3.1.0",
  "@emurgo/cardano-serialization-lib-nodejs-gc": ">=14.0.0",
  "@emurgo/cardano-message-signing-nodejs-gc": ">=1.0.0",
};

const opts = {
  entryPoints: ["src/publish/*.ts"],
  format: ["cjs", "esm"],
  dts: { resolve: true },
  clean: true,
  outDir: OUT_DIR,
  splitting: false,
  treeshake: true,
  noExternal: [/@anvil-vault\/.*/, "trynot"],
  external: Object.keys(externalDeps),
} satisfies Options;

async function findTsFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir, { recursive: false, withFileTypes: true });
  return files
    .filter((file) => file.isFile() && file.name.endsWith(".ts"))
    .map((file) => path.join(file.parentPath, file.name));
}

async function findDtsFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir, { recursive: true, withFileTypes: true });
  return files
    .filter(
      (file) => file.isFile() && (file.name.endsWith(".d.ts") || file.name.endsWith(".d.cts")),
    )
    .map((file) => path.join(file.parentPath, file.name));
}

type Exports = Record<
  string,
  | string
  | { require: { require: string; types: string }; import: { import: string; types: string } }
>;

async function copyPackageJson() {
  const srcFiles = (await findTsFiles("src/publish")).map(
    (file) => file.split("/").at(-1)?.replace(".ts", "") ?? "",
  );

  const pkg = {
    name: internalPkg.name,
    version: internalPkg.version,
    keywords: internalPkg.keywords,
    author: internalPkg.author,
    type: "module",
    sideEffects: false,
    files: ["**"],
    exports: srcFiles.reduce(
      (acc, file) => {
        acc[file === "index" ? "." : `./${file}`] = {
          require: {
            types: `./${file}.d.cts`,
            require: `./${file}.cjs`,
          },
          import: {
            types: `./${file}.d.ts`,
            import: `./${file}.js`,
          },
        };
        return acc;
      },
      { "./package.json": "./package.json" } as Exports,
    ),
    peerDependencies: externalDeps,
    peerDependenciesMeta: Object.keys(externalDeps).reduce<{ [index: string]: { optional: true } }>(
      (acc, key) => {
        acc[key] = { optional: true };
        return acc;
      },
      {},
    ),
  };

  await writeFile(path.join(OUT_DIR, "package.json"), JSON.stringify(pkg, null, 2));
}

async function main() {
  await build(opts);

  await copyPackageJson();

  for (const dtsFile of await findDtsFiles(OUT_DIR)) {
    await updateInternalImports(dtsFile);
  }

  for (const dtsFile of await findDtsFiles(OUT_DIR)) {
    await updateTrynotImports(dtsFile);
  }
}

async function updateTrynotImports(dtsFile: string) {
  const dtsContents = await readFile(dtsFile, "utf8");
  const internalImports = dtsContents.match(RESULT_IMPORT_REGEX);
  if (!internalImports?.length) {
    return;
  }
  const updatedDtsContents = dtsContents.replace(
    RESULT_IMPORT_REGEX,
    "type Result<T, E extends Error = Error> = T | E;",
  );
  if (updatedDtsContents !== dtsContents) {
    await writeFile(dtsFile, updatedDtsContents);
  }
}

async function updateInternalImports(dtsFile: string) {
  const ext = dtsFile.split(".").pop()?.replace("ts", "") ?? "";
  const dtsContents = await readFile(dtsFile, "utf8");
  const internalImports = dtsContents.match(INTERNAL_IMPORT_REGEX);
  if (!internalImports?.length) {
    return;
  }
  let updatedDtsContents = dtsContents;
  let shouldUpdateFile = true;
  for (const line of internalImports) {
    const matchArray = line.match(FROM_INTERNAL_REGEX);
    if (!matchArray) {
      continue;
    }
    const pkgName = matchArray[3];
    const copiedPath = `${OUT_DIR}/${pkgName}.d.${ext}ts`;
    await copyFile(`../../packages/${pkgName}/${opts.outDir}/index.d.ts`, copiedPath);
    await updateInternalImports(copiedPath);
    const result = line
      .replace(/^(import |export )/, "$1type ")
      .replace(new RegExp(FROM_INTERNAL_REGEX, "g"), `$1./$3.d.${ext}ts$4`);
    updatedDtsContents = updatedDtsContents.replace(line, result);
    if (dtsFile === copiedPath) {
      shouldUpdateFile = false;
    }
  }
  if (shouldUpdateFile) {
    await writeFile(dtsFile, updatedDtsContents);
  }
}

main();
