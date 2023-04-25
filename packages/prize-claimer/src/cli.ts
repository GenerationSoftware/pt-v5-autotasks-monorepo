import esMain from "es-main";

import figlet from "figlet";
import chalk from "chalk";
import Configstore from "configstore";
import { NETWORK_NAMES } from "./helpers/constants";
import { askQuestions } from "./helpers/questions";
import { ethers } from "ethers";
import {
  testnetContractsBlob as contracts,
  claimerHandleClaimPrize,
} from "@pooltogether/v5-autotasks-library";

import { handler } from "./handler";
import pkg from "../package.json";

const config = new Configstore(pkg.name);

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Prize Claim Bot")));

if (esMain(import.meta)) {
  const answers = await askQuestions(config);

  if (!answers.existingConfig) {
    config.set(answers);
  }

  // const provider = new DefenderRelayProvider(event);
  // const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  // const relayer = new Relayer(event);

  const chainId = Number(config.get("CHAIN_ID"));
  const feeRecipient = String(config.get("FEE_RECIPIENT"));

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[chainId],
    config.get("INFURA_API_KEY")
  );

  try {
    const transactionsPopulated = await claimerHandleClaimPrize(contracts, feeRecipient, {
      readProvider,
      chainId,
      provider: readProvider,
      // provider: signer,
    });
    console.log(transactionsPopulated);
  } catch (e) {
    console.error(e);
  }
  // const { RELAYER_API_KEY, RELAYER_API_SECRET } = process.env;
  // handler({
  //   apiKey: RELAYER_API_KEY,
  //   apiSecret: RELAYER_API_SECRET,
  // })
  //   .then(() => process.exit(0))
  //   .catch((error) => {
  //     console.error(error);
  //     process.exit(1);
  //   });
}

export function main() {}
// getStoredGithubToken: () => {
//   return conf.get("github.token");
// },
