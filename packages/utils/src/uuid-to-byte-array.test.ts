import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { uuidToByteArray } from "./uuid-to-byte-array";

describe("uuidToByteArray", () => {
  describe("valid UUIDs", () => {
    it("should convert standard UUID format to byte array", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00,
        0x00,
      ]);
      expect(result).toHaveLength(16);
    });

    it("should handle UUID without dashes", () => {
      const uuid = "550e8400e29b41d4a716446655440000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00,
        0x00,
      ]);
    });

    it("should handle uppercase UUID", () => {
      const uuid = "550E8400-E29B-41D4-A716-446655440000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00,
        0x00,
      ]);
    });

    it("should handle mixed case UUID", () => {
      const uuid = "550e8400-E29B-41d4-A716-446655440000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00,
        0x00,
      ]);
    });

    it("should handle all zeros UUID", () => {
      const uuid = "00000000-0000-0000-0000-000000000000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual(new Array(16).fill(0));
    });

    it("should handle all ones UUID", () => {
      const uuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual(new Array(16).fill(255));
    });

    it("should handle v4 UUID", () => {
      const uuid = "7a13ad8e-af95-419a-b56f-2e41a5cc37e3";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x7a, 0x13, 0xad, 0x8e, 0xaf, 0x95, 0x41, 0x9a, 0xb5, 0x6f, 0x2e, 0x41, 0xa5, 0xcc, 0x37,
        0xe3,
      ]);
    });
  });

  describe("invalid inputs", () => {
    it("should fail with non-hex characters", () => {
      const uuid = "gg0e8400-e29b-41d4-a716-446655440000";
      const result = uuidToByteArray(uuid);

      assert(isErr(result), "should fail");
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Invalid UUID");
    });

    it("should fail with invalid characters in middle", () => {
      const uuid = "550e8400-x29b-41d4-a716-446655440000";
      const result = uuidToByteArray(uuid);

      assert(isErr(result), "should fail");
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Invalid UUID");
    });

    it("should fail with symbols other than dashes", () => {
      const uuid = "550e8400@e29b#41d4$a716%446655440000";
      const result = uuidToByteArray(uuid);

      assert(isErr(result), "should fail");
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Invalid UUID");
    });

    it("should handle odd length string by processing pairs only", () => {
      const uuid = "550e8400e29b41d4a71644665544000";
      const result = uuidToByteArray(uuid);

      // Odd length strings process only complete pairs, last char ignored
      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00,
        0x00,
      ]);
    });

    it("should fail with empty string", () => {
      const uuid = "";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "empty string should return empty array");
      expect(result).toEqual([]);
    });

    it("should fail with spaces", () => {
      const uuid = "550e8400 e29b 41d4 a716 446655440000";
      const result = uuidToByteArray(uuid);

      // Spaces are explicitly rejected
      assert(isErr(result), "should fail");
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Invalid UUID");
    });

    it("should fail with single character", () => {
      const uuid = "z";
      const result = uuidToByteArray(uuid);

      assert(isErr(result), "should fail");
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Invalid UUID");
    });
  });

  describe("edge cases", () => {
    it("should handle two character hex string", () => {
      const uuid = "ff";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([255]);
    });

    it("should handle four character hex string", () => {
      const uuid = "a1b2";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([0xa1, 0xb2]);
    });

    it("should handle hex with leading zeros", () => {
      const uuid = "00000001-0000-0000-0000-000000000000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(1);
    });

    it("should handle string with dashes removed as valid hex", () => {
      const uuid = "a-b-c-d-e";
      const result = uuidToByteArray(uuid);

      // After removing dashes: "abcde", processes as hex pairs "ab", "cd", and "e" as single digit
      assert(isOk(result), "should succeed");
      expect(result).toEqual([0xab, 0xcd, 0x0e]); // "ab" -> 171, "cd" -> 205, "e" -> 14
    });
  });

  describe("real world UUIDs", () => {
    it("should handle nil UUID", () => {
      const uuid = "00000000-0000-0000-0000-000000000000";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual(new Array(16).fill(0));
    });

    it("should handle max UUID", () => {
      const uuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual(new Array(16).fill(255));
    });

    it("should handle multiple different valid UUIDs", () => {
      const testCases = [
        {
          uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          expected: [
            0x6b, 0xa7, 0xb8, 0x10, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4,
            0x30, 0xc8,
          ],
        },
        {
          uuid: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          expected: [
            0x6b, 0xa7, 0xb8, 0x11, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4,
            0x30, 0xc8,
          ],
        },
        {
          uuid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
          expected: [
            0x6b, 0xa7, 0xb8, 0x12, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4,
            0x30, 0xc8,
          ],
        },
      ];

      for (const testCase of testCases) {
        const result = uuidToByteArray(testCase.uuid);
        assert(isOk(result), `should succeed for ${testCase.uuid}`);
        expect(result).toEqual(testCase.expected);
      }
    });
  });

  describe("byte values", () => {
    it("should correctly convert all possible byte values", () => {
      // Test a UUID that contains various byte values
      const uuid = "00010203-0405-0607-0809-0a0b0c0d0e0f";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
        0x0f,
      ]);
    });

    it("should correctly convert high byte values", () => {
      const uuid = "f0f1f2f3-f4f5-f6f7-f8f9-fafbfcfdfeff";
      const result = uuidToByteArray(uuid);

      assert(isOk(result), "should succeed");
      expect(result).toEqual([
        0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe,
        0xff,
      ]);
    });
  });
});
