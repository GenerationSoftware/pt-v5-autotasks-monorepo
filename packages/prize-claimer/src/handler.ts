import { ethers } from "ethers";
import { RelayerParams } from "defender-relay-client";

import { NETWORK_NAMES } from "./helpers/constants";
import { populateTransactions, processPopulatedTransactions } from "./transactions";

const handlerLoadParams = () => {
  return { chainId: Number(CHAIN_ID), feeRecipient: FEE_RECIPIENT };
};

// Docs
export async function handler(event: RelayerParams) {
  const params = handlerLoadParams();

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[params.chainId],
    INFURA_API_KEY
  );

  const populatedTxs = await populateTransactions(params, readProvider);

  processPopulatedTransactions(event, populatedTxs);
}
