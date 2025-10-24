import { isBech32Address } from "@anvil-vault/utils";
import {
  Address,
  BaseAddress,
  EnterpriseAddress,
  PointerAddress,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { parseError, type Result } from "trynot";

export type ParsedAddress = BaseAddress | EnterpriseAddress | PointerAddress | RewardAddress;

export type ParseAddressInput = {
  address: Address | string | ParsedAddress;
};

/**
 * Parses a Cardano address from CSL object, bech32 string, or hex string.
 */
export function parseAddress(input: ParseAddressInput): Result<ParsedAddress> {
  try {
    let address: Address;
    if (input.address instanceof Address) {
      address = input.address;
    } else if (typeof input.address === "string" && isBech32Address(input.address)) {
      address = Address.from_bech32(input.address);
    } else if (typeof input.address === "string") {
      const bytes = Buffer.from(input.address, "hex");
      address = Address.from_bytes(bytes);
    } else {
      return input.address;
    }

    const baseAddress = BaseAddress.from_address(address);
    if (baseAddress) {
      return baseAddress;
    }
    const enterpriseAddress = EnterpriseAddress.from_address(address);
    if (enterpriseAddress) {
      return enterpriseAddress;
    }
    const pointerAddress = PointerAddress.from_address(address);
    if (pointerAddress) {
      return pointerAddress;
    }
    const rewardAddress = RewardAddress.from_address(address);
    if (rewardAddress) {
      return rewardAddress;
    }

    return new Error("Invalid address");
  } catch (error) {
    const parsedError = parseError(error);
    parsedError.message = `Invalid address: ${parsedError.message}`;
    return parsedError;
  }
}
