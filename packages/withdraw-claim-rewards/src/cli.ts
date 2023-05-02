import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import {
  NETWORK_NAMES,
  WithdrawClaimRewardsConfigParams
} from "@pooltogether/v5-autotasks-library";

import { checkPackageConfig, askQuestions } from "./helpers/questions";
import { populateTransaction, processPopulatedTransaction } from "./transactions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Withdraw Rewards Bot")));

function cliLoadParams(): WithdrawClaimRewardsConfigParams {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));
  const rewardsRecipient = String(config.get("REWARDS_RECIPIENT"));

  return {
    rewardsRecipient,
    chainId
  };
}

if (esMain(import.meta)) {
  const config = new Configstore(pkg.name);

  const answers = await askQuestions(config);
  if (!answers.existingConfig) {
    config.set(answers);
  }
  checkPackageConfig(config);

  const params: WithdrawClaimRewardsConfigParams = cliLoadParams();

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
  processPopulatedTransactions(fakeEvent, populatedTxs, params);
}

export function main() {}
