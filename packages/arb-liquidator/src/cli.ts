import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { Relayer } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { askQuestions } from './helpers/questions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Arb Liquidator Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };
  const relayer = new Relayer(fakeEvent);
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, {
    speed: 'fast',
  });
  const relayerAddress = await signer.getAddress();

  const params: ArbLiquidatorConfigParams = {
    relayerAddress,
    useFlashbots: config.USE_FLASHBOTS,
    writeProvider: signer,
    readProvider: new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID),
    swapRecipient: config.SWAP_RECIPIENT,
    chainId: config.CHAIN_ID,
  };

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    const contracts = await downloadContractsBlob(config.CHAIN_ID);
    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}

export function main() {}
