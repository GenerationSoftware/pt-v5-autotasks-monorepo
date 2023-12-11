import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  PrizeClaimerConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';
import { askQuestions } from './helpers/questions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Prize Claim Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));
  const readProvider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID);

  const mockEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider, // TODO: Fix this!
    readProvider,
    mockEvent,
    config.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const prizeClaimerConfigParams: PrizeClaimerConfigParams = {
    ...relayerAccount,
    readProvider,
    chainId: config.CHAIN_ID,
    feeRecipient: config.FEE_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: config.COVALENT_API_KEY,
  };

  await executeTransactions(prizeClaimerConfigParams);
}

export function main() {}
