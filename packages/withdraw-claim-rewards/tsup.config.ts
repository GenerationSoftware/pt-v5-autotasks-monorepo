import { defineConfig } from "tsup";

import Configstore from "configstore";
import pkg from "./package.json";

const config = new Configstore(pkg.name);

export default defineConfig(opt => {
  return {
    esbuildOptions: (options, context) => {
      (options.define.DEFENDER_TEAM_API_KEY = `'${config.get("DEFENDER_TEAM_API_KEY")}'`),
        (options.define.DEFENDER_TEAM_SECRET_KEY = `'${config.get("DEFENDER_TEAM_SECRET_KEY")}'`),
        (options.define.AUTOTASK_ID = `'${config.get("AUTOTASK_ID")}'`),
        (options.define.RELAYER_API_KEY = `'${config.get("RELAYER_API_KEY")}'`),
        (options.define.RELAYER_API_SECRET = `'${config.get("RELAYER_API_SECRET")}'`),
        (options.define.INFURA_API_KEY = `'${config.get("INFURA_API_KEY")}'`),
        (options.define.CHAIN_ID = `'${config.get("CHAIN_ID")}'`),
        (options.define.REWARDS_RECIPIENT = `'${config.get("REWARDS_RECIPIENT")}'`);
    },
    noExternal: ["@pooltogether/v5-autotasks-library", "ethereum-multicall", "configstore"],
    format: "cjs",
    entry: ["src/handler.ts"],
    splitting: false,
    clean: true
  };
});
