import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import {
  getProvider,
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

  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
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
