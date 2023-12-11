import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  RelayerAccount,
  YieldVaultMintRateConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';

import { askQuestions } from './helpers/questions';
import { processTransactions } from './transactions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('YieldVault MintRate Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));
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

  const yieldVaultMintRateConfigParams: YieldVaultMintRateConfigParams = {
    ...relayerAccount,
    readProvider,
    relayerAddress: relayerAccount.relayerAddress,
    chainId: config.CHAIN_ID,
  };

  await processTransactions(yieldVaultMintRateConfigParams);
}

export function main() {}
