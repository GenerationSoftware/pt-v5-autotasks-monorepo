import nodeFetch from 'node-fetch';
import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import { ContractsBlob, downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  getProvider,
  instantiateRelayerAccount,
  loadLiquidatorEnvVars,
  runLiquidator,
  LiquidatorConfig,
  LiquidatorEnvVars,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Liquidator Bot')));

if (esMain(import.meta)) {
  const envVars: LiquidatorEnvVars = loadLiquidatorEnvVars();
  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const liquidatorConfig: LiquidatorConfig = {
    ...relayerAccount,
    chainId: envVars.CHAIN_ID,
    provider,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: envVars.COVALENT_API_KEY,
    swapRecipient: envVars.SWAP_RECIPIENT,
    envTokenAllowList: envVars.ENV_TOKEN_ALLOW_LIST,
    pairsToLiquidate: envVars.PAIRS_TO_LIQUIDATE,
    contractJsonUrl: envVars.CONTRACT_JSON_URL,
  };

  const contracts: ContractsBlob = await downloadContractsBlob(
    liquidatorConfig.contractJsonUrl,
    nodeFetch,
  );
  await runLiquidator(contracts, liquidatorConfig);
}

export function main() {}
