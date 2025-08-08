import { assert } from "trynot";
import { describe, it } from "vitest";
import { isBech32Address } from "./is-bech-32-address.js";

describe("isBech32Address", () => {
  it("should return true for valid addr prefixed addresses", () => {
    assert(
      isBech32Address(
        "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
      ),
    );
    assert(
      isBech32Address(
        "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgsxj90mg",
      ),
    );
  });

  it("should return true for valid stake prefixed addresses", () => {
    assert(isBech32Address("stake1uyehkck0lajq8gr28t9uxnuvgcqrc6070x3k9r8048z8y5gh6ffgw"));
    assert(isBech32Address("stake_test1uqehkck0lajq8gr28t9uxnuvgcqrc6070x3k9r8048z8y5gssrtvn"));
  });

  it("should return false for addresses with invalid prefixes", () => {
    assert(
      !isBech32Address(
        "invalid1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
      ),
    );
    assert(!isBech32Address("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"));
  });

  it("should return false for empty string", () => {
    assert(!isBech32Address(""));
  });

  it("should return false for non-string inputs that start with valid prefixes", () => {
    assert(!isBech32Address("addr"));
    assert(!isBech32Address("stake"));
  });

  it("should return false for addresses that contain but don't start with valid prefixes", () => {
    assert(
      !isBech32Address(
        "some_addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
      ),
    );
    assert(!isBech32Address("prefix_stake1uyehkck0lajq8gr28t9uxnuvgcqrc6070x3k9r8048z8y5gh6ffgw"));
  });

  it("should handle case sensitivity correctly", () => {
    assert(
      !isBech32Address(
        "ADDR1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
      ),
    );
    assert(
      !isBech32Address(
        "Addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
      ),
    );
  });
});
