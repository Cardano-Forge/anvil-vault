import { parseError, type Result } from "trynot";

export function uuidToByteArray(uuid: string): Result<number[]> {
  try {
    if (uuid.includes(" ")) {
      throw new Error("Invalid UUID");
    }
    const hex = uuid.replace(/-/g, "").toLowerCase();
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      const byte = Number.parseInt(hex.substring(i, i + 2), 16);
      if (Number.isNaN(byte)) {
        throw new Error("Invalid UUID");
      }
      bytes.push(byte);
    }
    return bytes;
  } catch (error) {
    return parseError(error);
  }
}
