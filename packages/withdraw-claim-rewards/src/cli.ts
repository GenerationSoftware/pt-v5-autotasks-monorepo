import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import { WithdrawClaimRewardsConfigParams } from "@pooltogether/v5-autotasks-library";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { checkPackageConfig, askQuestions } from "./helpers/questions";
import { populateTransaction, processPopulatedTransaction } from "./transactions";

import pkg from "../package.json";

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Withdraw Rewards Bot")));

function cliLoadParams(relayerAddress): WithdrawClaimRewardsConfigParams {
  const config = new Configstore(pkg.name);

  const chainId = Number(config.get("CHAIN_ID"));
  const rewardsRecipient = String(config.get("REWARDS_RECIPIENT"));

  return {
    relayerAddress,
    rewardsRecipient,
    chainId
  };
}

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
  const relayerAddress = await signer.getAddress();

  const params: WithdrawClaimRewardsConfigParams = cliLoadParams(relayerAddress);

  const readProvider = new ethers.providers.InfuraProvider(
    params.chainId,
    config.get("INFURA_API_KEY")
  );
  const populatedTxs = await populateTransaction(params, readProvider);

  await processPopulatedTransaction(fakeEvent, populatedTxs);
}

export function main() {}
