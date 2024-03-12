import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import {
  getProvider,
  instantiateRelayerAccount,
  RelayerAccount,
  YieldVaultMintRateConfig,
  loadEnvVars,
  AutotaskEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './executeTransactions';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('YieldVault MintRate Bot')));

if (esMain(import.meta)) {
  const envVars: AutotaskEnvVars = loadEnvVars();

  const provider: BaseProvider = getProvider(envVars);

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: YieldVaultMintRateConfig = {
    ...relayerAccount,
    provider,
    relayerAddress: relayerAccount.relayerAddress,
    chainId: envVars.CHAIN_ID,
  };

  await executeTransactions(config);
}

export function main() {}
