import { copyFile, readFile, writeFile } from "node:fs/promises";
import type { Format } from "tsup";

export type BuildInternalPackageTypesOpts = {
  outDir: string;
  format: Format | Format[];
};

export async function buildInternalPackageTypes(opts: BuildInternalPackageTypesOpts) {
  const fileName = "index";
  const localDir = "../..";

  const extensionPrefixes = Array.isArray(opts.format) ? ["c", ""] : [""];
  for (const ext of extensionPrefixes) {
    const copiedDtsFiles = new Set<string>();
    const dtsFilePath = `./${opts.outDir}/${fileName}.d.${ext}ts`;
    await updateImports(
      dtsFilePath,
      { outDir: opts.outDir, localDir, fileName, ext },
      copiedDtsFiles,
    );
  }
}

async function updateImports(
  dtsFilePath: string,
  opts: { outDir: string; fileName: string; localDir: string; ext: string },
  copiedDtsFiles: Set<string>,
) {
  const dtsContents = await readFile(dtsFilePath, "utf8");
  const internalImports = dtsContents.match(internalImportRegex);

  if (!internalImports?.length) {
    return;
  }

  let updatedDtsContents = dtsContents;
  for (const line of internalImports) {
    const matchArray = line.match(fromInternalRegex);
    if (!matchArray) {
      continue;
    }

    const pkgName = matchArray[3];

    // Copy dts file if not already copied
    if (!copiedDtsFiles.has(pkgName)) {
      copiedDtsFiles.add(pkgName);
      const copiedPath = `./${opts.outDir}/${pkgName}.d.${opts.ext}ts`;
      const folder = pkgName.endsWith("-service") ? "services" : "packages";
      await copyFile(
        `${opts.localDir}/${folder}/${pkgName.replace("-service", "")}/${opts.outDir}/index.d.ts`,
        copiedPath,
      );
      await updateImports(copiedPath, opts, copiedDtsFiles);
    }

    // Update current package dts file
    const result = line.replace(new RegExp(fromInternalRegex, "g"), `$1./$3.${opts.ext}js$4`);
    updatedDtsContents = updatedDtsContents.replace(line, result);
  }

  // Write updated dts file
  return writeFile(dtsFilePath, updatedDtsContents);
}

const internalImportRegex = /(import |export )(.*)( from ["']@anvil-vault\/)(.*)(["'];)/g;
const fromInternalRegex = /(["'])(@anvil-vault\/)(.*)(["'])/;
