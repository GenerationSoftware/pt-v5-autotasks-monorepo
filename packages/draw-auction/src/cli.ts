import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { DrawAuctionConfigParams } from '@generationsoftware/pt-v5-autotasks-library';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { executeTransactions } from './transactions';
import { askQuestions } from './helpers/questions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Draw Auction Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));

  const rngReadProvider = new ethers.providers.JsonRpcProvider(
    config.JSON_RPC_URI, // is RNG chain but needs to be just JSON_RPC_URI for global config to work properly
    config.CHAIN_ID, // is RNG chain but needs to be just CHAIN_ID for global config to work properly
  );
  const relayReadProvider = new ethers.providers.JsonRpcProvider(
    config.RELAY_JSON_RPC_URI,
    config.RELAY_CHAIN_ID,
  );

  const rngChainFakeEvent = {
    apiKey: config.RELAYER_API_KEY, // is RNG chain but needs to just be RELAYER_API_KEY for global config to work
    apiSecret: config.RELAYER_API_SECRET, // is RNG chain but needs to just be RELAYER_API_KEY for global config to work
  };
  const rngWriteProvider = new DefenderRelayProvider(rngChainFakeEvent);
  const signer = new DefenderRelaySigner(rngChainFakeEvent, rngWriteProvider, {
    speed: 'fast',
  });

  const relayChainFakeEvent = {
    apiKey: config.RELAY_RELAYER_API_KEY,
    apiSecret: config.RELAY_RELAYER_API_SECRET,
  };
  const relayWriteProvider = new DefenderRelayProvider(relayChainFakeEvent);

  const relayerAddress = await signer.getAddress();
  const params: DrawAuctionConfigParams = {
    rngChainId: config.CHAIN_ID,
    relayChainId: config.RELAY_CHAIN_ID,
    rngReadProvider,
    relayReadProvider,
    rngWriteProvider,
    relayWriteProvider,
    relayerAddress,
    rewardRecipient: config.REWARD_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: config.COVALENT_API_KEY,
  };

  await executeTransactions(rngChainFakeEvent, relayChainFakeEvent, params, signer);
}

export function main() {}
