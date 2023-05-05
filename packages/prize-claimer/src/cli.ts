import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import {
  printAsterisks,
  printSpacer,
  NETWORK_NAMES,
  PrizeClaimerConfigParams
} from "@pooltogether/v5-autotasks-library";

import { populateTransactions, processPopulatedTransactions } from "./transactions";
import { checkPackageConfig, askQuestions } from "./helpers/questions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Prize Claim Bot")));

function cliLoadParams(): PrizeClaimerConfigParams {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));
  const feeRecipient = String(config.get("FEE_RECIPIENT"));

  const useFlashbots = Boolean(config.get("USE_FLASHBOTS"));

  return {
    useFlashbots,
    feeRecipient,
    chainId
  };
}

if (esMain(import.meta)) {
  const config = new Configstore(pkg.name);

  const answers = await askQuestions(config, { askFlashbots: true });
  if (!answers.existingConfig) {
    config.set(answers);
  }
  checkPackageConfig(config);

  const params: PrizeClaimerConfigParams = cliLoadParams();

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[params.chainId],
    config.get("INFURA_API_KEY")
  );

  const populatedTxs = await populateTransactions(params, readProvider);

  printAsterisks();
  console.log(chalk.blue(`5. Sending transactions ...`));
  printSpacer();

  const fakeEvent = {
    apiKey: config.get("RELAYER_API_KEY"),
    apiSecret: config.get("RELAYER_API_SECRET")
  };
  await processPopulatedTransactions(fakeEvent, populatedTxs, params);
}

export function main() {}
