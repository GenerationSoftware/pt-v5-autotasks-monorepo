import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  RelayerAccount,
  YieldVaultMintRateConfig,
} from '@generationsoftware/pt-v5-autotasks-library';

import { processTransactions } from './transactions';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('YieldVault MintRate Bot')));

if (esMain(import.meta)) {
  const readProvider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID);

  const mockEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider, // TODO: Fix this!
    readProvider,
    mockEvent,
    config.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: YieldVaultMintRateConfig = {
    ...relayerAccount,
    readProvider,
    relayerAddress: relayerAccount.relayerAddress,
    chainId: config.CHAIN_ID,
  };

  await processTransactions(config);
}

export function main() {}
