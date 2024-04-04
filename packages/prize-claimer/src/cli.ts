import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import {
  getProvider,
  instantiateRelayerAccount,
  PrizeClaimerEnvVars,
  PrizeClaimerConfig,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './executeTransactions';
import { loadPrizeClaimerEnvVars } from './loadPrizeClaimerEnvVars';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Prize Claim Bot')));

if (esMain(import.meta)) {
  const envVars: PrizeClaimerEnvVars = loadPrizeClaimerEnvVars();

  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: PrizeClaimerConfig = {
    ...relayerAccount,
    provider,
    chainId: envVars.CHAIN_ID,
    rewardRecipient: envVars.REWARD_RECIPIENT,
    useFlashbots: envVars.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: envVars.COVALENT_API_KEY,
  };

  await executeTransactions(config);
}

export function main() {}
