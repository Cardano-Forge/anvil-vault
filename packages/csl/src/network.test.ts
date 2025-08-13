import { describe, expect, it } from "vitest";
import { getNetworkId, networks } from "./network";

describe("network", () => {
  describe("networks", () => {
    it("should contain the expected network names", () => {
      expect(networks).toEqual(["mainnet", "preprod", "preview"]);
    });
  });

  describe("getNetworkId", () => {
    it("should return 1 for mainnet", () => {
      expect(getNetworkId("mainnet")).toBe(1);
    });

    it("should return 0 for preprod", () => {
      expect(getNetworkId("preprod")).toBe(0);
    });

    it("should return 0 for preview", () => {
      expect(getNetworkId("preview")).toBe(0);
    });

    it("should return the same number when given a NetworkId", () => {
      expect(getNetworkId(0)).toBe(0);
      expect(getNetworkId(1)).toBe(1);
      expect(getNetworkId(42)).toBe(42);
    });
  });
});
