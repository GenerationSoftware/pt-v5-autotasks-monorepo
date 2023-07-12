import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { askQuestions } from './helpers/questions';
import { processTransaction } from './transactions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Testnet: Complete Draw Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, { speed: 'fast' });

  const params = {
    writeProvider: signer,
    readProvider: new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID),
    chainId: config.CHAIN_ID,
  };

  await processTransaction(fakeEvent, params);
}

export function main() {}
