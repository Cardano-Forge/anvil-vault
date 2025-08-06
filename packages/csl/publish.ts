import { getTsupPublishConfig, publish } from "@anvil-vault/publish";

async function main() {
  const buildConfig = getTsupPublishConfig();
  return publish(buildConfig);
}

main();
