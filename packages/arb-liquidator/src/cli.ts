import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
import { ContractsBlob, downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';

import { askQuestions } from './helpers/questions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Arb Liquidator Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));

  const mockEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };

  const readProvider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider, // TODO: Fix this!
    readProvider,
    mockEvent,
    config.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const arbLiquidatorConfigParams: ArbLiquidatorConfigParams = {
    ...relayerAccount,
    writeProvider: readProvider, // TODO: Fix this!
    readProvider: readProvider,
    covalentApiKey: config.COVALENT_API_KEY,
    chainId: config.CHAIN_ID,
    swapRecipient: config.SWAP_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
  };

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(config.CHAIN_ID);
    await liquidatorArbitrageSwap(contracts, arbLiquidatorConfigParams);
  } catch (error) {
    throw new Error(error);
  }
}

export function main() {}
