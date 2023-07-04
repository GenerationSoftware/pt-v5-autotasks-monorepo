import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { DrawReserveConfigParams } from '@generationsoftware/pt-v5-autotasks-library';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { askQuestions } from './helpers/questions';
import { populateTransaction, processPopulatedTransaction } from './transactions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Draw Reserve Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name), { askFlashbots: false });

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, { speed: 'fast' });
  const relayerAddress = await signer.getAddress();

  const params: DrawReserveConfigParams = {
    relayerAddress,
    reserveRecipient: config.RESERVE_RECIPIENT,
    chainId: config.CHAIN_ID,
  };

  const readProvider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID);
  const populatedTxs = await populateTransaction(params, readProvider);

  await processPopulatedTransaction(fakeEvent, populatedTxs);
}

export function main() {}
