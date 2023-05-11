import { ethers } from "ethers";
import { RelayerParams } from "defender-relay-client";

import { processTransaction } from "./transactions";

const handlerLoadParams = () => {
  const chainId = Number(CHAIN_ID);
  const readProvider = new ethers.providers.InfuraProvider(chainId, INFURA_API_KEY);

  return { chainId, readProvider };
};

export async function handler(event: RelayerParams) {
  const params = handlerLoadParams();

  await processTransaction(event, params);
}
