const BECH32_PREFIXES = ["addr", "stake"] as const;

/**
 * Checks if an address string uses bech32 encoding format.
 * @param address - The address string to check.
 */
export function isBech32Address(address: string): boolean {
  return BECH32_PREFIXES.some(
    (prefix) => address.startsWith(prefix) && address.length > prefix.length,
  );
}
