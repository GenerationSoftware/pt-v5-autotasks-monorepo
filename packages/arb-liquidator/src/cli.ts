import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import {
  testnetContractsBlob as contracts,
  liquidatorArbitrageSwap,
  NETWORK_NAMES,
  ArbLiquidatorSwapParams
} from "@pooltogether/v5-autotasks-library";
import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { askQuestions, checkPackageConfig } from "./helpers/questions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Arb Liquidator Bot")));

const cliLoadParams = (signer: Provider | DefenderRelaySigner): ArbLiquidatorSwapParams => {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));
  const swapRecipient = String(config.get("SWAP_RECIPIENT"));
  const relayerAddress = String(config.get("RELAYER_ADDRESS"));

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[chainId],
    config.get("INFURA_API_KEY")
  );

  return {
    writeProvider: signer,
    readProvider,
    relayerAddress,
    swapRecipient,
    chainId
  };
};

if (esMain(import.meta)) {
  const config = new Configstore(pkg.name);

  const answers = await askQuestions(config);
  if (!answers.existingConfig) {
    config.set(answers);
  }
  checkPackageConfig(config);

  const fakeEvent = {
    apiKey: config.get("RELAYER_API_KEY"),
    apiSecret: config.get("RELAYER_API_SECRET")
  };
  const relayer = new Relayer(fakeEvent);
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, { speed: "fast" });

  const params: ArbLiquidatorSwapParams = cliLoadParams(signer);

  try {
    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}

export function main() {}
