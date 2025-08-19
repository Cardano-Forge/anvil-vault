/**
 * Runtime validation for optional peer dependencies
 * @param name - Human-readable name for the functionality
 * @param moduleName - The npm package name to validate
 * @throws Error if the peer dependency is not installed
 */
export function validatePeerDependency(name: string, moduleName: string): void {
  try {
    require.resolve(moduleName);
  } catch {
    throw new Error(
      `${name} functionality requires the '${moduleName}' package to be installed. ` +
        `Install it with: npm install ${moduleName}`,
    );
  }
}
