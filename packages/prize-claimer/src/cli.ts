import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import { printAsterisks, printSpacer } from "@pooltogether/v5-autotasks-library";

import { populateTransactions, processPopulatedTransactions } from "./transactions";
import { askQuestions } from "./helpers/questions";
import { NETWORK_NAMES } from "./helpers/constants";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Prize Claim Bot")));

function cliLoadParams() {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));
  const feeRecipient = String(config.get("FEE_RECIPIENT"));

  return {
    feeRecipient,
    chainId,
  };
}

if (esMain(import.meta)) {
  const config = new Configstore(pkg.name);

  const answers = await askQuestions(config);
  if (!answers.existingConfig) {
    config.set(answers);
  }

  const params = cliLoadParams();

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[params.chainId],
    config.get("INFURA_API_KEY")
  );

  const populatedTxs = await populateTransactions(params, readProvider);

  printAsterisks();
  console.log(chalk.blue(`5. Sending transactions ...`));
  printSpacer();
  console.log("populatedTxs");
  console.log(populatedTxs);
  printSpacer();

  const { RELAYER_API_KEY, RELAYER_API_SECRET } = process.env;

  const fakeEvent = {
    apiKey: RELAYER_API_KEY,
    apiSecret: RELAYER_API_SECRET,
  };
  processPopulatedTransactions(fakeEvent, populatedTxs);
}

export function main() {}
