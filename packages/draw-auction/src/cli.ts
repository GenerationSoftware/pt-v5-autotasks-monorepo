import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers, Wallet } from 'ethers';
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

  let signer, rngRelayerAddress, rngRelayer;
  if (config.CUSTOM_RELAYER_PRIVATE_KEY) {
    const wallet = new Wallet(config.CUSTOM_RELAYER_PRIVATE_KEY, rngReadProvider);
    rngRelayerAddress = wallet.address;
    rngRelayer = wallet;
    signer = wallet;
  } else {
    const rngChainFakeEvent = {
      apiKey: config.RELAYER_API_KEY, // is RNG chain but needs to just be RELAYER_API_KEY for global config to work
      apiSecret: config.RELAYER_API_SECRET, // is RNG chain but needs to just be RELAYER_API_KEY for global config to work
    };

    const rngWriteProvider = new DefenderRelayProvider(rngChainFakeEvent);
    const signer = new DefenderRelaySigner(rngChainFakeEvent, rngWriteProvider, {
      speed: 'fast',
    });
    rngRelayerAddress = await signer.getAddress();
    rngRelayer = signer;
  }

  const params: DrawAuctionConfigParams = {
    rngChainId: config.CHAIN_ID,
    rngReadProvider,
    rngRelayerAddress,
    rewardRecipient: config.REWARD_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: config.COVALENT_API_KEY,
  };

  await executeTransactions(rngRelayer, params, signer, config.RELAYS);
}

export function main() {}
