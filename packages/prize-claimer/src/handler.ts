import { ethers } from "ethers";
import { RelayerParams } from "defender-relay-client";
import { PrizeClaimerConfigParams, NETWORK_NAMES } from "@pooltogether/v5-autotasks-library";

import { populateTransactions, processPopulatedTransactions } from "./transactions";

const handlerLoadParams = (): PrizeClaimerConfigParams => {
  return { chainId: Number(CHAIN_ID), feeRecipient: FEE_RECIPIENT };
};

export async function handler(event: RelayerParams) {
  console.clear();

  const params = handlerLoadParams();

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[params.chainId],
    INFURA_API_KEY
  );

  const populatedTxs = await populateTransactions(params, readProvider);

  await processPopulatedTransactions(event, populatedTxs, params);
}
