import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  LiquidatorConfig,
  RelayerAccount,
  LiquidatorEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';

import { loadLiquidatorEnvVars } from './loadLiquidatorEnvVars';
import { executeTransactions } from './executeTransactions';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Arb Liquidator Bot')));

if (esMain(import.meta)) {
  const envVars: LiquidatorEnvVars = loadLiquidatorEnvVars();
  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const l1Provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    l1Provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: LiquidatorConfig = {
    ...relayerAccount,
    l1Provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    chainId: envVars.CHAIN_ID,
    swapRecipient: envVars.SWAP_RECIPIENT,
    useFlashbots: envVars.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
  };

  await executeTransactions(config);
}

export function main() {}
