import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { PrizeClaimerConfigParams } from '@pooltogether/v5-autotasks-library';

import { executeTransactions } from './transactions';

const handlerLoadParams = (): PrizeClaimerConfigParams => {
  return {
    chainId: Number(BUILD_CHAIN_ID),
    feeRecipient: BUILD_FEE_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
  };
};

export async function handler(event: RelayerParams) {
  const params = handlerLoadParams();

  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, params.chainId);

  await executeTransactions(event, readProvider, params);

  // const populatedTxs = await populateTransactions(params, readProvider);
  // await processPopulatedTransactions(event, populatedTxs, params);
}
