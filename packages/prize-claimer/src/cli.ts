import nodeFetch from 'node-fetch';
import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  getProvider,
  loadPrizeClaimerEnvVars,
  instantiateRelayerAccount,
  runPrizeClaimer,
  PrizeClaimerEnvVars,
  PrizeClaimerConfig,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blueBright(figlet.textSync('Prize Claimer Bot')));

if (esMain(import.meta)) {
  const envVars: PrizeClaimerEnvVars = loadPrizeClaimerEnvVars();

  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const prizeClaimerConfig: PrizeClaimerConfig = {
    ...relayerAccount,
    chainId: envVars.CHAIN_ID,
    provider,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: envVars.COVALENT_API_KEY,
    rewardRecipient: envVars.REWARD_RECIPIENT,
    subgraphUrl: envVars.SUBGRAPH_URL,
    contractJsonUrl: envVars.CONTRACT_JSON_URL,
  };

  const contracts: ContractsBlob = await downloadContractsBlob(
    prizeClaimerConfig.contractJsonUrl,
    nodeFetch,
  );
  await runPrizeClaimer(contracts, prizeClaimerConfig);
}

export function main() {}
