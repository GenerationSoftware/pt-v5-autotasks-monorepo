import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { Relayer } from "defender-relay-client";
import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import { NETWORK_NAMES } from "@pooltogether/v5-autotasks-library";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { askQuestions, checkPackageConfig } from "./helpers/questions";
import { processTransaction } from "./transactions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Testnet: Complete Draw Bot")));

const cliLoadParams = (signer: Provider | DefenderRelaySigner) => {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[chainId],
    config.get("INFURA_API_KEY")
  );

  return {
    writeProvider: signer,
    readProvider,
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

  processTransaction(fakeEvent, params);
}

export function main() {}
