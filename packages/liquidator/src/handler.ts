import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  LiquidatorConfig,
  LiquidatorEnvVars,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
// import fetch from 'node-fetch';

import { loadLiquidatorEnvVars } from './loadLiquidatorEnvVars';
import { executeTransactions } from './transactions';

export async function handler(event) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: BUILD_MIN_PROFIT_THRESHOLD_USD,
    swapRecipient: BUILD_SWAP_RECIPIENT,
  };

  const envVars: LiquidatorEnvVars = loadLiquidatorEnvVars(buildVars, event);

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const l1Provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    l1Provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: LiquidatorConfig = {
    ...relayerAccount,
    l1Provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    chainId: envVars.CHAIN_ID,
    swapRecipient: envVars.SWAP_RECIPIENT,
    useFlashbots: envVars.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
  };

  await executeTransactions(config);
}
