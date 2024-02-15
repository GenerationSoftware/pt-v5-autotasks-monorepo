import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  FlashLiquidatorConfig,
  FlashLiquidatorEnvVars,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { loadFlashLiquidatorEnvVars } from './loadFlashLiquidatorEnvVars';
import { executeTransactions } from './executeTransactions';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Flash Liquidator Bot')));

if (esMain(import.meta)) {
  const envVars: FlashLiquidatorEnvVars = loadFlashLiquidatorEnvVars();
  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: FlashLiquidatorConfig = {
    ...relayerAccount,
    provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    chainId: envVars.CHAIN_ID,
    swapRecipient: envVars.SWAP_RECIPIENT,
    useFlashbots: envVars.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
  };

  await executeTransactions(config);
}

export function main() {}
