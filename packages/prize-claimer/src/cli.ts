import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { ExecuteClaimerProfitablePrizeTxsParams } from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';
import { askQuestions } from './helpers/questions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Prize Claim Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));
  const readProvider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID);
  const params: ExecuteClaimerProfitablePrizeTxsParams = {
    chainId: config.CHAIN_ID,
    feeRecipient: config.FEE_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
  };

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };
  await executeTransactions(fakeEvent, readProvider, params);
}

export function main() {}
