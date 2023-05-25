import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';

import { processTransaction } from './transactions';

const handlerLoadParams = () => {
  const chainId = Number(BUILD_CHAIN_ID);
  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, chainId);

  return { chainId, readProvider };
};

export async function handler(event: RelayerParams) {
  const params = handlerLoadParams();

  await processTransaction(event, params);
}
