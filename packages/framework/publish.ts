import { copyFile, readFile, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { type Options, build } from "tsup";

const OUT_DIR = "out";
const INTERNAL_PKG_ORG = "@anvil-vault";
const INTERNAL_IMPORT_REGEX = new RegExp(
  `(import |export )(.*)( from ["']${INTERNAL_PKG_ORG}\\/)(.*)(["'];)`,
  "g",
);
const FROM_INTERNAL_REGEX = new RegExp(`(["'])(${INTERNAL_PKG_ORG}\\/)(.*)(["'])`);

const opts = {
  entryPoints: ["src/*.ts"],
  format: ["cjs", "esm"],
  dts: { resolve: true },
  clean: true,
  outDir: OUT_DIR,
  splitting: false,
  treeshake: true,
  noExternal: [/@anvil-vault\/.*/],
  external: [
    "bip39",
    "@emurgo/cardano-serialization-lib-nodejs-gc",
    "@emurgo/cardano-message-signing-nodejs-gc",
    "zod",
    "trynot",
  ],
} satisfies Options;

async function findDtsFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir, { recursive: true, withFileTypes: true });
  return files
    .filter(
      (file) => file.isFile() && (file.name.endsWith(".d.ts") || file.name.endsWith(".d.cts")),
    )
    .map((file) => path.join(file.parentPath, file.name));
}

async function main() {
  await build(opts);

  await copyFile("package.json", path.join(OUT_DIR, "package.json"));

  const dtsFiles = await findDtsFiles(OUT_DIR);
  for (const dtsFile of dtsFiles) {
    await updateImports(dtsFile);
  }
}

async function updateImports(dtsFile: string) {
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
    await updateImports(copiedPath);
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
