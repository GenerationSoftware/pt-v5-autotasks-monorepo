// import nodeFetch from 'node-fetch';
import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
// import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  getProvider,
  instantiateRelayerAccount,
  loadFlashLiquidatorEnvVars,
  runFlashLiquidator,
  FlashLiquidatorConfig,
  RelayerAccount,
  FlashLiquidatorEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Flash Liquidator Bot')));

if (esMain(import.meta)) {
  const envVars: FlashLiquidatorEnvVars = loadFlashLiquidatorEnvVars();
  const provider: BaseProvider = getProvider(envVars);
  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const FlashLiquidatorConfig: FlashLiquidatorConfig = {
    ...relayerAccount,
    chainId: Number(envVars.CHAIN_ID),
    provider,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: envVars.COVALENT_API_KEY,
    swapRecipient: envVars.SWAP_RECIPIENT,
    contractJsonUrl: envVars.CONTRACT_JSON_URL,
  };

  // const contracts = await downloadContractsBlob(FlashLiquidatorConfig.contractJsonUrl, nodeFetch);
  await runFlashLiquidator(FlashLiquidatorConfig);
}

export function main() {}
