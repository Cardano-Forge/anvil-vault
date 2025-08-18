/** Adds 2^31 (0x80000000) to the number to indicate hardened derivation */
export function harden(num: number): number {
  return 0x80000000 + num;
}
