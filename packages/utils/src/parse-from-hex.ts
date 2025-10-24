import { parseError, type Result } from "trynot";

// biome-ignore lint/suspicious/noExplicitAny: don't care about the constructor if input is always undefined
export function parseFromHex(hexOrInstance: undefined, HexConstuctor?: any): undefined;
export function parseFromHex(hexOrInstance: Buffer | string): Result<Buffer>;
export function parseFromHex(
  hexOrInstance: Buffer | string | undefined,
): Result<Buffer | undefined>;
export function parseFromHex<T>(
  hexOrInstance: T | string,
  HexConstructor: { from_hex: (hex: string) => T },
): Result<T>;
export function parseFromHex<T>(
  hexOrInstance: T | string | undefined,
  HexConstructor: { from_hex: (hex: string) => T },
): Result<T | undefined>;
export function parseFromHex<T>(
  hexOrInstance: T | string | undefined,
  HexConstructor?: { from_hex: (hex: string) => T },
): Result<T | undefined> {
  if (hexOrInstance === undefined) {
    return undefined;
  }
  if (typeof hexOrInstance !== "string") {
    return hexOrInstance;
  }
  try {
    if (HexConstructor === undefined) {
      return Buffer.from(hexOrInstance, "hex") as T;
    }
    return HexConstructor.from_hex(hexOrInstance);
  } catch (error) {
    return parseError(error);
  }
}
