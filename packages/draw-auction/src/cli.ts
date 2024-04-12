import nodeFetch from 'node-fetch';
import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { BaseProvider } from '@ethersproject/providers';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  getProvider,
  instantiateRelayerAccount,
  loadDrawAuctionEnvVars,
  runDrawAuction,
  DrawAuctionConfig,
  RelayerAccount,
  DrawAuctionEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Draw Auction Bot')));

if (esMain(import.meta)) {
  const envVars: DrawAuctionEnvVars = loadDrawAuctionEnvVars();
  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfig: DrawAuctionConfig = {
    ...relayerAccount,
    chainId: Number(envVars.CHAIN_ID),
    provider,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
    covalentApiKey: envVars.COVALENT_API_KEY,
    rewardRecipient: envVars.REWARD_RECIPIENT,
  };

  try {
    const rngContracts = await downloadContractsBlob(drawAuctionConfig.chainId, nodeFetch);

    await runDrawAuction(rngContracts, drawAuctionConfig);
  } catch (e) {
    console.error(e);
  }
}

export function main() {}
