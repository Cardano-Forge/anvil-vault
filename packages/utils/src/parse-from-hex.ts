import { type Result, parseError } from "trynot";

export function parseFromHex<T>(
  hexOrInstance: T | string,
  HexConstructor: { from_hex: (hex: string) => T },
): Result<T> {
  if (typeof hexOrInstance !== "string") {
    return hexOrInstance;
  }
  try {
    return HexConstructor.from_hex(hexOrInstance);
  } catch (error) {
    return parseError(error);
  }
}
