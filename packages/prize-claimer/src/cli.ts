import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import {
  printAsterisks,
  printSpacer,
  PrizeClaimerConfigParams
} from "@pooltogether/v5-autotasks-library";

import { populateTransactions, processPopulatedTransactions } from "./transactions";
import { askQuestions } from "./helpers/questions";

// @ts-ignore
import pkg from "../package.json" assert { type: "json" };

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Prize Claim Bot")));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name), { askFlashbots: true });
  const readProvider = new ethers.providers.JsonRpcProvider(
    config.JSON_RPC_URI,
    config.CHAIN_ID
  );
  const params: PrizeClaimerConfigParams = {
    chainId: config.CHAIN_ID,
    feeRecipient: config.FEE_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS
  };
  const populatedTxs = await populateTransactions(params, readProvider);

  printAsterisks();
  console.log(chalk.blue(`6. Sending transactions ...`));
  printSpacer();

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET
  };
  await processPopulatedTransactions(fakeEvent, populatedTxs, params);
}

export function main() {}
