import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { Provider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { askQuestions, checkPackageConfig } from "./helpers/questions";
import { processTransactions } from "./transactions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("YieldVault MintRate Bot")));

const cliLoadParams = (signer: Provider | DefenderRelaySigner) => {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));

  return {
    provider: signer,
    chainId
  };
};

if (esMain(import.meta)) {
  const config = new Configstore(pkg.name);

  const answers = await askQuestions(config, { askFlashbots: false });
  if (!answers.existingConfig) {
    config.set(answers);
  }
  checkPackageConfig(config);

  const fakeEvent = {
    apiKey: config.get("RELAYER_API_KEY"),
    apiSecret: config.get("RELAYER_API_SECRET")
  };
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, { speed: "fast" });

  const params = cliLoadParams(signer);

  processTransactions(fakeEvent, params);
}

export function main() {}
