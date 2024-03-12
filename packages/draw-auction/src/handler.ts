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

export async function handler(event) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: BUILD_MIN_PROFIT_THRESHOLD_USD,
    rewardRecipient: BUILD_REWARD_RECIPIENT,
  };

  const envVars: DrawAuctionEnvVars = loadDrawAuctionEnvVars(buildVars, event);

  const provider: BaseProvider = getProvider(envVars);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    event,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfig: DrawAuctionConfig = {
    chainId: Number(envVars.CHAIN_ID),
    provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    useFlashbots: envVars.USE_FLASHBOTS,
    rewardRecipient: envVars.REWARD_RECIPIENT,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),

    customRelayerPrivateKey: envVars.CUSTOM_RELAYER_PRIVATE_KEY,

    relayerApiKey: envVars.RELAYER_API_KEY,
    relayerApiSecret: envVars.RELAYER_API_SECRET,

    signer: relayerAccount.signer,
    ozRelayer: relayerAccount.ozRelayer,
    wallet: relayerAccount.wallet,
    relayerAddress: relayerAccount.relayerAddress,
  };

  await executeTransactions(drawAuctionConfig);
}
