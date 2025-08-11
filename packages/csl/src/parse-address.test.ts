import {
  Address,
  BaseAddress,
  EnterpriseAddress,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs-gc";
import { assert, isErr, isOk } from "trynot";
import { describe, expect, it } from "vitest";
import { parseAddress } from "./parse-address";

const tests = {
  script: {
    keyHashes: {
      payment: "b8d7e2950424d82e6ee695b6464f4898104c8ff4fb1647882d4db7d3",
      stake: "79ce41cc084b55730549dbbb6fbc89553c1a55876fb58d8c3a223ff5",
    },
    addresses: {
      mainnet: {
        base: "addr1xxud0c54qsjdstnwu62mv3j0fzvpqny07na3v3ug94xm05meeequczzt24es2jwmhdhmez248sd9tpm0kkxccw3z8l6sjylh0a",
        enterprise: "addr1wxud0c54qsjdstnwu62mv3j0fzvpqny07na3v3ug94xm05carz0s8",
        reward: "stake179uuuswvpp942uc9f8dmkmau392ncxj4sahmtrvv8g3rlag5ghar0",
      },
      preprod: {
        base: "addr_test1xzud0c54qsjdstnwu62mv3j0fzvpqny07na3v3ug94xm05meeequczzt24es2jwmhdhmez248sd9tpm0kkxccw3z8l6s3jzhrz",
        enterprise: "addr_test1wzud0c54qsjdstnwu62mv3j0fzvpqny07na3v3ug94xm05cxtknlz",
        reward: "stake_test17puuuswvpp942uc9f8dmkmau392ncxj4sahmtrvv8g3rlagnzal8j",
      },
    },
  },
  wallet: {
    keyHashes: {
      payment: "f724afc7718bdc0a2fe00cb23f4ec261dcd6278ed48d68ceac6877f8",
      stake: "52f756ebf79d3094bb6ececb7ba140c14c03e84c72399ad2eafb7dc2",
    },
    addresses: {
      mainnet: {
        base: "addr1q8mjft78wx9acz30uqxty06wcfsae4383m2g66xw435807zj7atwhauaxz2tkmkweda6zsxpfsp7snrj8xdd96hm0hpqdf0674",
        enterprise: "addr1v8mjft78wx9acz30uqxty06wcfsae4383m2g66xw435807q2kyr4c",
        reward: "stake1u9f0w4ht77wnp99mdm8vk7apgrq5cqlgf3ernxkjatahmsshj5vc9",
      },
      preprod: {
        base: "addr_test1qrmjft78wx9acz30uqxty06wcfsae4383m2g66xw435807zj7atwhauaxz2tkmkweda6zsxpfsp7snrj8xdd96hm0hpqwlj6j2",
        enterprise: "addr_test1vrmjft78wx9acz30uqxty06wcfsae4383m2g66xw435807q37sl6a",
        reward: "stake_test1upf0w4ht77wnp99mdm8vk7apgrq5cqlgf3ernxkjatahmsssc7wuc",
      },
    },
  },
};

for (const [type, testCase] of Object.entries(tests)) {
  describe(`parseAddress for ${type} addresses`, () => {
    for (const [network, addresses] of Object.entries(testCase.addresses)) {
      it(`should parse ${network} base address and extract correct key hashes`, () => {
        const bech32 = addresses.base;
        const addressObj = Address.from_bech32(bech32);
        const hex = addressObj.to_hex();

        for (const address of [bech32, addressObj, hex]) {
          const result = parseAddress({ address });
          assert(isOk(result), "Expected parseAddress to succeed");
          assert(result instanceof BaseAddress, "Expected BaseAddress");

          expect(parseAddress({ address: result })).toBe(result);

          const paymentHash = result.payment_cred().has_script_hash()
            ? result.payment_cred().to_scripthash()?.to_hex()
            : result.payment_cred().to_keyhash()?.to_hex();
          const stakeHash = result.stake_cred()?.has_script_hash()
            ? result.stake_cred().to_scripthash()?.to_hex()
            : result.stake_cred()?.to_keyhash()?.to_hex();

          expect(paymentHash).toBe(testCase.keyHashes.payment);
          expect(stakeHash).toBe(testCase.keyHashes.stake);
        }
      });

      it(`should parse ${network} enterprise address and extract correct payment key hash`, () => {
        const bech32 = addresses.enterprise;
        const addressObj = Address.from_bech32(bech32);
        const hex = addressObj.to_hex();

        for (const address of [bech32, addressObj, hex]) {
          const result = parseAddress({ address });
          assert(isOk(result), "Expected parseAddress to succeed");
          assert(result instanceof EnterpriseAddress, "Expected EnterpriseAddress");

          expect(parseAddress({ address: result })).toBe(result);

          const paymentHash = result.payment_cred().has_script_hash()
            ? result.payment_cred().to_scripthash()?.to_hex()
            : result.payment_cred().to_keyhash()?.to_hex();

          expect(paymentHash).toBe(testCase.keyHashes.payment);
        }
      });

      it(`should parse ${network} reward address and extract correct stake key hash`, () => {
        const bech32 = addresses.reward;
        const addressObj = Address.from_bech32(bech32);
        const hex = addressObj.to_hex();

        for (const address of [bech32, addressObj, hex]) {
          const result = parseAddress({ address });
          assert(isOk(result), "Expected parseAddress to succeed");
          assert(result instanceof RewardAddress, "Expected RewardAddress");

          expect(parseAddress({ address: result })).toBe(result);

          const stakeHash = result.payment_cred()?.has_script_hash()
            ? result.payment_cred().to_scripthash()?.to_hex()
            : result.payment_cred()?.to_keyhash()?.to_hex();

          expect(stakeHash).toBe(testCase.keyHashes.stake);
        }
      });
    }
  });
}

it("should return error for invalid address", () => {
  const result = parseAddress({ address: "invalid_address" });
  assert(isErr(result), "Expected parseAddress to fail");
  expect(result.message).toContain("Invalid address");
});
