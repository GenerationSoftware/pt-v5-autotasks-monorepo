import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  RelayerAccount,
  YieldVaultMintRateConfig,
  loadEnvVars,
  AutotaskEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';

import { executeTransactions } from './transactions';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('YieldVault MintRate Bot')));

if (esMain(import.meta)) {
  const envVars: AutotaskEnvVars = loadEnvVars();

  const l1Provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    l1Provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: YieldVaultMintRateConfig = {
    ...relayerAccount,
    l1Provider,
    relayerAddress: relayerAccount.relayerAddress,
    chainId: envVars.CHAIN_ID,
  };

  await executeTransactions(config);
}

export function main() {}
