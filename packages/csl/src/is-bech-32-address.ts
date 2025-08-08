const BECH32_PREFIXES = ["addr", "stake"] as const;

export function isBech32Address(address: string): boolean {
  return BECH32_PREFIXES.some(
    (prefix) => address.startsWith(prefix) && address.length > prefix.length,
  );
}
