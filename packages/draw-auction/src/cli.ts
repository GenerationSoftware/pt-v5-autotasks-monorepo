import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import {
  getProvider,
  instantiateRelayerAccount,
  DrawAuctionConfig,
  RelayerAccount,
  DrawAuctionEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './executeTransactions';
import { loadDrawAuctionEnvVars } from './loadDrawAuctionEnvVars';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Draw Auction Bot')));

if (esMain(import.meta)) {
  const envVars: DrawAuctionEnvVars = loadDrawAuctionEnvVars();

  const provider: BaseProvider = getProvider(envVars);

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY, // RNG chain OZ relayer API Key
    apiSecret: envVars.RELAYER_API_SECRET, // RNG chain OZ relayer API secret
  };

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfig: DrawAuctionConfig = {
    chainId: Number(envVars.CHAIN_ID),
    provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    useFlashbots: envVars.USE_FLASHBOTS,
    rewardRecipient: envVars.REWARD_RECIPIENT,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),

    customRelayerPrivateKey: process.env.CUSTOM_RELAYER_PRIVATE_KEY,

    relayerApiKey: process.env.RELAYER_API_KEY,
    relayerApiSecret: process.env.RELAYER_API_SECRET,

    signer: relayerAccount.signer,
    wallet: relayerAccount.wallet,
    ozRelayer: relayerAccount.ozRelayer,
    relayerAddress: relayerAccount.relayerAddress,
  };

  await executeTransactions(drawAuctionConfig);
}

export function main() {}
