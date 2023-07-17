import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { DrawAuctionConfigParams } from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

const handlerLoadParams = (): DrawAuctionConfigParams => {
  return {
    chainId: Number(BUILD_CHAIN_ID),
    rewardRecipient: BUILD_REWARD_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };
};

export async function handler(event: RelayerParams) {
  const params = handlerLoadParams();

  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, params.chainId);

  await executeTransactions(event, readProvider, params);
}
