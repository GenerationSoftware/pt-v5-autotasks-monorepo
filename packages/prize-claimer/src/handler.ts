import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import {
  instantiateRelayerAccount,
  PrizeClaimerEnvVars,
  PrizeClaimerConfig,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';
import { loadPrizeClaimerEnvVars } from './loadPrizeClaimerEnvVars';

export async function handler(event: RelayerParams) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: BUILD_MIN_PROFIT_THRESHOLD_USD,
    feeRecipient: BUILD_FEE_RECIPIENT,
  };

  const envVars: PrizeClaimerEnvVars = loadPrizeClaimerEnvVars(buildVars, event);

  // TODO: This doesn't make any sense, in the handler we have the event
  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const readProvider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider,
    readProvider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const prizeClaimerConfig: PrizeClaimerConfig = {
    ...relayerAccount,
    chainId: envVars.CHAIN_ID,
    readProvider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    feeRecipient: BUILD_FEE_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };

  await executeTransactions(prizeClaimerConfig);
}
