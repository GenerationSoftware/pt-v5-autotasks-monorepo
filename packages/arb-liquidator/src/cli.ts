import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import { testnetContractsBlobSepolia as contracts } from "@pooltogether/v5-utils-js";
import {
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams
} from "@pooltogether/v5-autotasks-library";
import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { askQuestions, checkPackageConfig } from "./helpers/questions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Arb Liquidator Bot")));

const cliLoadParams = (
  signer: Provider | DefenderRelaySigner,
  relayerAddress: string
): ArbLiquidatorConfigParams => {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));
  const swapRecipient = String(config.get("SWAP_RECIPIENT"));
  const useFlashbots = Boolean(config.get("USE_FLASHBOTS"));

  const readProvider = new ethers.providers.InfuraProvider(chainId, config.get("INFURA_API_KEY"));

  return {
    relayerAddress,
    useFlashbots,
    writeProvider: signer,
    readProvider,
    swapRecipient,
    chainId
  };
};

if (esMain(import.meta)) {
  const config = new Configstore(pkg.name);

  const answers = await askQuestions(config, { askFlashbots: true });
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
  const signer = new DefenderRelaySigner(fakeEvent, provider, {
    speed: "fast"
  });
  const relayerAddress = await signer.getAddress();

  const params: ArbLiquidatorConfigParams = cliLoadParams(signer, relayerAddress);

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}

export function main() {}
