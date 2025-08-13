export const networks = ["mainnet", "preprod", "preview"] as const;

export type Network = (typeof networks)[number];

export type NetworkId = number;

export function getNetworkId(network: Network | NetworkId): NetworkId {
  if (typeof network === "number") {
    return network;
  }
  return Number(network === "mainnet");
}
