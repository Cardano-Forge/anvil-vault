import { getTsupBuildConfig } from "@anvil-vault/tsup";
export default getTsupBuildConfig({
  entry: ["src"],
  bundle: false,
});
