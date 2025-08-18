import { assert, isErr, isOk } from "trynot";
import { describe, expect, it, vi } from "vitest";
import { getDerivation } from "./get-derivation";
import type { Derivation } from "./types";

const mockUserId = "7a13ad8e-af95-419a-b56f-2e41a5cc37e3";

describe("getDerivation", () => {
  describe("constant derivation", () => {
    it("should return single number value", async () => {
      const derivation: Derivation = {
        type: "constant",
        value: 42,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toBe(42);
    });

    it("should return array value", async () => {
      const derivation: Derivation = {
        type: "constant",
        value: [1, 2, 3],
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("pool derivation", () => {
    it("should return deterministic value within pool size", async () => {
      const derivation: Derivation = {
        type: "pool",
        size: 10,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it("should return same value for same userId", async () => {
      const derivation: Derivation = {
        type: "pool",
        size: 5,
      };

      const result1 = await getDerivation({
        userId: mockUserId,
        derivation,
      });
      const result2 = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result1), "first call should succeed");
      assert(isOk(result2), "second call should succeed");
      expect(result1).toBe(result2);
    });

    it("should distribute across pool size", async () => {
      const derivation: Derivation = {
        type: "pool",
        size: 3,
      };

      const userIds = [
        "00000000-0000-0000-0000-000000000000",
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
        "33333333-3333-3333-3333-333333333333",
        "44444444-4444-4444-4444-444444444444",
      ];

      const results = await Promise.all(
        userIds.map((userId) => getDerivation({ userId, derivation })),
      );

      // All results should be successful
      for (const result of results) {
        assert(isOk(result), "should succeed");
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(3);
      }
    });
  });

  describe("unique derivation", () => {
    it("should return UUID bytes without scrambler", async () => {
      const derivation: Derivation = {
        type: "unique",
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(16); // UUID is 16 bytes
    });

    it("should apply scrambler when provided", async () => {
      const scrambler = vi.fn().mockResolvedValue([9, 8, 7]);
      const derivation: Derivation = {
        type: "unique",
        scrambler,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toEqual([9, 8, 7]);
      expect(scrambler).toHaveBeenCalledWith(
        expect.any(Array), // userIdBytes
        { userId: mockUserId, derivation },
        undefined, // context
      );
    });

    it("should pass context to scrambler", async () => {
      const context = { network: 1, rootKey: () => "test" };
      const scrambler = vi.fn().mockResolvedValue([5, 6, 7]);
      const derivation: Derivation<typeof context> = {
        type: "unique",
        scrambler,
      };

      const result = await getDerivation(
        {
          userId: mockUserId,
          derivation,
        },
        context,
      );

      assert(isOk(result), "should succeed");
      expect(scrambler).toHaveBeenCalledWith(
        expect.any(Array),
        { userId: mockUserId, derivation },
        context,
      );
    });

    it("should handle scrambler errors", async () => {
      const scrambler = vi.fn().mockRejectedValue(new Error("Scrambler failed"));
      const derivation: Derivation = {
        type: "unique",
        scrambler,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isErr(result), "should fail");
      expect(result.message).toBe("Scrambler failed");
    });
  });

  describe("custom derivation", () => {
    it("should return number from provider", async () => {
      const provider = vi.fn().mockResolvedValue(123);
      const derivation: Derivation = {
        type: "custom",
        provider,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toBe(123);
      expect(provider).toHaveBeenCalledWith({ userId: mockUserId, derivation }, undefined);
    });

    it("should return array from provider", async () => {
      const provider = vi.fn().mockResolvedValue([1, 2, 3, 4]);
      const derivation: Derivation = {
        type: "custom",
        provider,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should recursively resolve nested derivation", async () => {
      const nestedDerivation: Derivation = {
        type: "constant",
        value: 999,
      };

      const provider = vi.fn().mockResolvedValue(nestedDerivation);
      const derivation: Derivation = {
        type: "custom",
        provider,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toBe(999);
    });

    it("should handle deeply nested derivations", async () => {
      const level3: Derivation = { type: "constant", value: 42 };
      const level2: Derivation = {
        type: "custom",
        provider: vi.fn().mockResolvedValue(level3),
      };
      const level1: Derivation = {
        type: "custom",
        provider: vi.fn().mockResolvedValue(level2),
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation: level1,
      });

      assert(isOk(result), "should succeed");
      expect(result).toBe(42);
    });

    it("should pass context to provider", async () => {
      const context = { network: 0, rootKey: () => "test" };
      const provider = vi.fn().mockResolvedValue(77);
      const derivation: Derivation<typeof context> = {
        type: "custom",
        provider,
      };

      const result = await getDerivation(
        {
          userId: mockUserId,
          derivation,
        },
        context,
      );

      assert(isOk(result), "should succeed");
      expect(provider).toHaveBeenCalledWith({ userId: mockUserId, derivation }, context);
    });

    it("should handle provider errors", async () => {
      const provider = vi.fn().mockRejectedValue(new Error("Provider failed"));
      const derivation: Derivation = {
        type: "custom",
        provider,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isErr(result), "should fail");
      expect(result.message).toBe("Provider failed");
    });

    it("should handle provider returning error result", async () => {
      const provider = vi.fn().mockResolvedValue(new Error("Custom error"));
      const derivation: Derivation = {
        type: "custom",
        provider,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isErr(result), "should fail");
      expect(result.message).toBe("Custom error");
    });
  });

  describe("error handling", () => {
    it("should handle invalid userId", async () => {
      const derivation: Derivation = {
        type: "pool",
        size: 5,
      };

      // Use a string that will cause parseInt to return NaN
      const result = await getDerivation({
        userId: "gg-invalid-uuid-gg", // Contains non-hex characters
        derivation,
      });

      expect(result).toBeInstanceOf(Error);
    });

    it("should handle zero pool size", async () => {
      const derivation: Derivation = {
        type: "pool",
        size: 0,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      expect(isErr(result)).toBe(true);
    });
  });

  describe("overloads", () => {
    it("should work without context", async () => {
      const derivation: Derivation = {
        type: "constant",
        value: 100,
      };

      const result = await getDerivation({
        userId: mockUserId,
        derivation,
      });

      assert(isOk(result), "should succeed");
      expect(result).toBe(100);
    });

    it("should work with context", async () => {
      const context = { testValue: 123 };
      const provider = vi.fn().mockResolvedValue(456);
      const derivation: Derivation<typeof context> = {
        type: "custom",
        provider,
      };

      const result = await getDerivation(
        {
          userId: mockUserId,
          derivation,
        },
        context,
      );

      assert(isOk(result), "should succeed");
      expect(result).toBe(456);
      expect(provider).toHaveBeenCalledWith(expect.any(Object), context);
    });
  });
});
