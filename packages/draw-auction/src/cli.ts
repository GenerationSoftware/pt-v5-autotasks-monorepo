import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  DrawAuctionConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';

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

  const mockEvent = {
    apiKey: config.RELAYER_API_KEY, // is RNG chain but needs to just be RELAYER_API_KEY for global config to work
    apiSecret: config.RELAYER_API_SECRET, // is RNG chain but needs to just be RELAYER_API_KEY for global config to work
  };
  const rngWriteProvider = new DefenderRelayProvider(mockEvent);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    rngWriteProvider,
    rngReadProvider,
    mockEvent,
    config.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfigParams: DrawAuctionConfigParams = {
    rngChainId: config.CHAIN_ID,
    rngReadProvider,
    signer: relayerAccount.signer,
    rngRelayer: relayerAccount.relayer,
    rngRelayerAddress: relayerAccount.relayerAddress,
    rewardRecipient: config.REWARD_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: config.COVALENT_API_KEY,
  };

  await executeTransactions(drawAuctionConfigParams, config.RELAYS);
}

export function main() {}
