import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";

import { askQuestions } from "./helpers/questions";
import { processTransactions } from "./transactions";

// @ts-ignore
import pkg from "../package.json" assert { type: "json" };

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("YieldVault MintRate Bot")));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name), { askFlashbots: false });

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET
  };

  const params = {
    chainId: config.CHAIN_ID
  };

  await processTransactions(fakeEvent, params);
}

export function main() {}
