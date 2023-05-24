import esMain from "es-main";
import Configstore from "configstore";
import figlet from "figlet";
import chalk from "chalk";
import { ethers } from "ethers";
import { testnetContractsBlob as contracts } from "@pooltogether/v5-utils-js";
import {
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams
} from "@pooltogether/v5-autotasks-library";
import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { askQuestions } from "./helpers/questions";

// @ts-ignore
import pkg from "../package.json" assert { type: "json" };

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Arb Liquidator Bot")));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name), { askFlashbots: true });

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET
  };
  const relayer = new Relayer(fakeEvent);
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, {
    speed: "fast"
  });
  const relayerAddress = await signer.getAddress();

  const params: ArbLiquidatorConfigParams = {
    relayerAddress,
    useFlashbots: config.USE_FLASHBOTS,
    writeProvider: signer,
    readProvider: new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID),
    swapRecipient: config.SWAP_RECIPIENT,
    chainId: config.CHAIN_ID
  };

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}

export function main() {}
